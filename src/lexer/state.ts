import { BitSet } from '../util/bitset';
import { CharSet } from './char-set';
import { console } from '../util/common';
import { DFA } from './dfa.js';
// import { DataSet } from '../util/interval-set';
import { OutputStream, StringOS } from '../util/io';
import { EscapeDef, escapeString } from '../util/span';

export enum Action{
    START = 0,
    END,
    NONE
}
var maxlen = 0;
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
    least: boolean = false;
    id: number = 0;
    data: T = null;
}
export class State<T>{
    valid: boolean = false;
    arcs: Arc<T>[] = [];
    epsilons: State<T>[] = [];
    index: number = 0;
    isStart: boolean = false;
    isEnd: boolean = false;
    marker: boolean = false;
    endAction: EndAction<T> = null;
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
    hasDefinate(){
        return this.arcs.length === 1 && this.arcs[0].chars.constainsAll();
    }
    iterator(epOnly: boolean = false): () => State<T>{
        var queue: State<T>[] = [this];
        var states: State<T>[] = [this];
    
        this.marker = true;
        return () => {
            if(queue.length > 0){
                var s = queue.pop();
                if(!epOnly){
                    for(let arc of s.arcs){
                        var to = arc.to;
                        if(!to.marker){
                            queue.push(to);
                            states.push(to);
                            to.marker = true;
                        }
                    }
                }
                for(let to of s.epsilons){
                    if(!to.marker){
                        queue.push(to);
                        states.push(to);
                        to.marker = true;
                    }
                }
                return s;
            }
            else {
                for(var state of states){
                    state.marker = false;
                }
                return null;
            }
        };
    }
    forEach(cb: (s: State<T>) => void, epOnly: boolean = false): void{
        var queue: State<T>[] = [this];
        var states: State<T>[] = [this];
    
        this.marker = true;
        while(queue.length > 0){
            var s = queue.pop();
            cb(s);
            if(!epOnly){
                for(let arc of s.arcs){
                    var to = arc.to;
                    if(!to.marker){
                        queue.push(to);
                        states.push(to);
                        to.marker = true;
                    }
                }
            }
            for(let to of s.epsilons){
                if(!to.marker){
                    queue.push(to);
                    states.push(to);
                    to.marker = true;
                }
            }
        }
        for(var state of states){
            state.marker = false;
        }
    }
    number(): void{
        var i = 0;
        this.forEach(function(state){
            state.index = i++;
        });
    }
    print(os: OutputStream, escapes?: EscapeDef, recursive: boolean = true){
        var endl = '\n';
        var tab = '    ';
        function echo(s: string){
            if(escapes){
                s = escapeString(s, escapes);
            }
            os.writeln(s);
        }
        function single(cela: State<T>): string{
            let ret = '';
            ret += `state ${cela.index}`;
            if(cela.isStart){
                ret += '(start)';
            }
            if(cela.endAction){
                ret += `(end ${cela.endAction.id})`;
                //ret += '(end: ' + cela.endAction.id + ')';
            }
            ret += endl;
            for(var i = 0;i < cela.arcs.length;i++){
                var arc = cela.arcs[i];
                ret += (`${tab}${arc.chars.toString()} -> state ${arc.to.index}${endl}`);
            }
            if(cela.epsilons.length > 0){
                ret += `${tab}epsilon: `;
                for(var i = 0;i < cela.epsilons.length;i++){
                    if(i > 0){
                        ret += ',';
                    }
                    ret += cela.epsilons[i].index.toString();
                }
                ret += endl;
            }
            return ret;
        }
        if(!recursive){
            echo(single(this));
        }
        else {
            var ret = '';
            this.forEach(state => {
                echo(single(state));
            });
        }
    }
    toString(escapes?: EscapeDef, recursive: boolean = true): string{
        let ss = new StringOS();
        this.print(ss, escapes, recursive);
        return ss.s;
    }

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
    allChars(set: CharSet<State<T>[]>){
        var cela = this;
        for(var i = 0;i < this.arcs.length;i++){
            //set.union(this.arcs[i].chars);
            var arc = this.arcs[i];
            arc.chars.forEach(function(a, b){
                set.add(a, b, [arc.to]);
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
    clone(){

    }
    toDFA(): { head: State<T>, states: State<T>[] }{

        var dfaStates: { [s: string]: CompoundState<T> } = {};
        var states: State<T>[] = [];
        var dfaCount = 0;
        var stateCount = this.count();
    
        var set = new CharSet<State<T>[]>({
            createData: () => [],
            union(dest: State<T>[], src: State<T>[]){
                for(let s of src){
                    let dup = false;
                    for(let destt of dest){
                        if(s === destt){
                            dup = true;
                            break;
                        }
                    }
                    !dup && dest.push(s);
                }
            },
            stringify: d => '' // not needed here, actually
        });

        var cela = this;
        
        // initiation,put {start} into the dfaStates.
        var initState = new CompoundState(stateCount,[this]);
        initState.index = dfaCount++;
        states.push(initState);
        var lastState = initState;
        dfaStates[initState.hash()] = initState;

        var queue: CompoundState<T>[] = [initState];
    
        while(queue.length > 0){
            var s = queue.shift();
            // clear set and arc array
            set.removeAll();
            // find all the characters that this state can accept
            s.allChars(set);
            set.forEach(function(chara,charb,it){
                var cpState = new CompoundState<T>(stateCount, it.data);
                var cphash = cpState.hash();
                if(dfaStates[cphash]){
                    // this state est deja connu
                    cpState = dfaStates[cphash];
                }
                else {
                    dfaStates[cphash] = cpState;
                    (cpState.endAction === null || !cpState.endAction.least) && queue.push(cpState);
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

    allChars(set: CharSet<State<T>[]>){
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
