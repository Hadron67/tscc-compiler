import { BitSet } from '../util/bitset';
import { YYTAB } from '../util/common';
import { CharSet } from './char-set';
import { console } from '../util/common';
import { DFA } from './dfa.js';
import { DataSet } from '../util/interval-set';

export enum Action{
    START = 0,
    END,
    NONE
}
var maxlen = 0;
class StateArray<T> extends Array<State<T>> implements DataSet<State<T>>{
    constructor(){
        super(0);
        // XXX: fix prototype chain?
        (Object as any).setPrototypeOf(this, StateArray.prototype);
    }
    add(s: State<T>){
        for(var s2 of this){
            if(s === s2){
                // console.log('hit: ' + s.index);
                return;
            }
        }
        this.length > maxlen && (maxlen = this.length);
        this.push(s);
    }
    union(s: StateArray<T>){
        for(var state of s){
            this.add(state);
        }
    }
    toArray(){
        var ret: State<T>[] = [];
        for(let s of this){
            ret.push(s);
        }
        return ret;
    }
}
export class Arc<T>{
    chars: CharSet<any> = new CharSet<any>();
    from: State<T>;
    to: State<T>;
    constructor(from: State<T>, to: State<T>){
        this.from = from;
        this.to = to;
    }
}
export class EndAction<T>{
    priority: number = 0;
    id: number = 0;
    data: T = null;
}
export class State<T>{
    valid: boolean = false;
    arcs: Arc<T>[] = [];
    epsilons: State<T>[] = [];
    index: number = -1;
    isStart: boolean = false;
    isEnd: boolean = false;
    endAction: EndAction<T>;
    constructor(endAction?: EndAction<T>){
        this.endAction = endAction || null;
    }
    findArc(to: State<T>): Arc<T>{
        for(var arc of this.arcs){
            if(arc.to === to){
                return arc;
            }
        }
        return null;
    }
    /**
     * create an arc and link the state to another with that arc.
     * 
     * @param {State} s
     * @returns {Arc} the created arc.
     */
    to(s: State<T>): Arc<T>{
        var arc = this.findArc(s);
        if(arc === null){
            arc = new Arc<T>(this, s);
            this.arcs.push(arc);
        }
        s.valid = true;
        return arc;
    }
    epsilonTo(s: State<T>): void{
        this.epsilons.push(s);
    }
    /**
     * iterate all the states that can be reached from the state.
     * 
     * 
     */
    forEach(cb: (s: State<T>) => void, epOnly: boolean = false): void{
        var queue: State<T>[] = [this];
        var deja: boolean[] = [];
    
        deja[this.index] = true;
        while(queue.length > 0){
            var s = queue.pop();
            cb(s);
            if(!epOnly){
                for(var j = 0;j < s.arcs.length;j++){
                    var to = s.arcs[j].to;
                    if(!deja[to.index]){
                        queue.push(to);
                        deja[to.index] = true;
                    }
                }
            }
            for(var j = 0;j < s.epsilons.length;j++){
                var to = s.epsilons[j];
                if(!deja[to.index]){
                    queue.push(to);
                    deja[to.index] = true;
                }
            }
        }
    }
    number(): void{
        var i = 0;
        this.forEach(function(state){
            state.index = i++;
        });
    }
    toString(recursive?: boolean): string{
        recursive = !!recursive;
        function single(){
            var ret = 'state ' + this.index;
            if(this.isStart){
                ret += '(start)';
            }
            if(this.endAction){
                ret += '(end: ' + this.endAction.id + ')';
            }
            ret += '\n';
            for(var i = 0;i < this.arcs.length;i++){
                var arc = this.arcs[i];
                ret += YYTAB + arc.chars.toString() + ' -> state ' + arc.to.index + '\n';
            }
            if(this.epsilons.length > 0){
                ret += YYTAB + 'epsilon: ';
                for(var i = 0;i < this.epsilons.length;i++){
                    if(i > 0){
                        ret += ',';
                    }
                    ret += this.epsilons[i].index;
                }
                ret += '\n';
            }
            return ret;
        }
        if(!recursive){
            return single.call(this);
        }
        else {
            var ret = '';
            this.forEach(function(state){
                ret += single.call(state) + '\n';
            });
            return ret;
        }
    }
    /**
     * @param {State} state
     */
    copyEndFrom(state: State<T>): void{
        if(state.endAction !== null){
            if(this.endAction !== null){
                if(this.endAction.priority < state.endAction.priority){
                    this.endAction = state.endAction;
                }
            }
            else {
                this.endAction = state.endAction;
            }
        }
    }
    removeEpsilons(): void{
        var cela = this;
        var valid: State<T>[] = [this];
        this.forEach(function(s){
            if(s.valid){
                valid.push(s);
            }
        });
        for(var i = 0;i < valid.length;i++){
            var s = valid[i];
            s.forEach(function(state){
                if(state !== s){
                    for(var j = 0;j < state.arcs.length;j++){
                        var arc = state.arcs[j];
                        s.to(arc.to).chars.union(arc.chars);
                    }
                    //s.isEnd = s.isEnd || state.isEnd;
                    s.copyEndFrom(state);
                }
            },true);
            s.epsilons.length = 0;
        }
        for(var i = 0;i < valid.length;i++){
            valid[i].index = i;
        }
    }
    count(): number{
        var c = 0;
        this.forEach(function(){
            c++;
        });
        return c;
    }
    
    size(): number{
        var i = 0;
        this.forEach(function(){
            i++;
        });
        return i;
    }
    /**
     * get all the characters that this state can accept
     * @param {CharSet} set The set that the resulting characters add into
     */
    allChars(set: CharSet<State<T>>){
        var cela = this;
        for(var i = 0;i < this.arcs.length;i++){
            //set.union(this.arcs[i].chars);
            var arc = this.arcs[i];
            arc.chars.forEach(function(a, b){
                set.add(a, b, arc.to);
            });
        }
    }
    /**
     * @param {string} char
     * @returns {State}
     */
    getState(char: number): State<T>{
        for(var i = 0;i < this.arcs.length;i++){
            var arc = this.arcs[i];
            if(arc.chars.contains(char)){
                return arc.to;
            }
        }
        return null;
    }
    hasArc(): boolean{
        return this.arcs.length > 0;
    }
    toDFA(): { head: State<T>, states: State<T>[] }{
        /**
         * the resulting dfa states
         * @type {Object.<string,CompoundState>}
         */
        var dfaStates: { [s: string]: CompoundState<T> } = {};
        /**
         * an array containing all the dfa states
         * @type {State[]}
         */
        var states: State<T>[] = [];
        var dfaCount = 0;
        var stateCount = this.count();
    
        /**
         * set that used to all the characters,in order not to create
         * a new object everytime.
         * @type {CharSet}
         */
        var set = new CharSet<State<T>>(() => new StateArray<T>());

        var cela = this;
        
        // initiation,put {start} into the dfaStates.
        var initState = new CompoundState(stateCount,[this]);
        initState.index = dfaCount++;
        states.push(initState);
        var lastState = initState;
        dfaStates[initState.hash()] = initState;
        /**
         * queue of dfastates to be processed
         * @type {CompoundState[]}
         */
        var queue: CompoundState<T>[] = [initState];
    
        while(queue.length > 0){
            var s = queue.shift();
            // clear set and arc array
            set.removeAll();
            // find all the characters that this state can accept
            s.allChars(set);
            set.forEach(function(chara,charb,it){
                var cpState = new CompoundState<T>(stateCount,it.dataSet.toArray());
                var cphash = cpState.hash();
                if(dfaStates[cphash]){
                    // this state est deja connu
                    cpState = dfaStates[cphash];
                }
                else {
                    dfaStates[cphash] = cpState;
                    queue.push(cpState);
                    cpState.index = dfaCount++;
                    states.push(cpState);
                }
                s.to(cpState).chars.add(chara,charb);
            });
        }
        initState.release();
        return {
            head: initState,
            states: states
        };
    }
}

class CompoundState<T> extends State<T>{
    stateSet: BitSet;
    states: State<T>[];
    constructor(stateCount: number, states: State<T>[]){
        super();
        this.isEnd = this.isStart = false;
        this.valid = true;
        this.states = states;
        this.stateSet = new BitSet(stateCount);
        for(var i = 0;i < states.length;i++){
            this.stateSet.add(states[i].index);
            //this.isEnd = this.isEnd || states[i].isEnd;
            this.copyEndFrom(states[i]);
            this.isStart = this.isStart || states[i].isStart;
        }
    }
    hash(): string{
        return this.stateSet.hash();
    }

    // getStates(char: string, states: BitSet){
    //     for(var i = 0;i < this.states.length;i++){
    //         State.prototype.getStates.call(this.states[i],char,states);
            
    //     }
    // }

    allChars(set: CharSet<State<T>>){
        for(var i = 0;i < this.states.length;i++){
            // State.prototype.allChars.call(this.states[i],set);
            this.states[i].allChars(set);
        }
    }
    forEach(cb: (s: CompoundState<T>) => void){
        super.forEach(cb);
    }
    release(){
        this.forEach(function(state){
            state.states.length = 0;
        });
    }
}
