import { State, Arc, EndAction } from './state';
import { Context } from '../util/context';
import { CompilationError } from '../util/E';
import { DFA } from './dfa';
import { Coroutine } from '../util/coroutine';

class CmdArray{
    opcodes: ((s: StateBuilder<any>) => void)[] = [];
    constructor(public label: string){
    }
}

interface varDef{
    line: number;
    cmds: CmdArray;
};

export class StateBuilder<T>{
    head: State<T> = new State<T>();
    currentState: State<T> = null;
    unionStack: { head: State<T>, tail: State<T> }[] = [];
    // naive stack    +1s
    simpleStack: State<T>[] = [];
    currentArc: Arc<T> = null;
    isInverse: boolean = false;
    possibleAlias: string = null;
    first = false;

    scount = 0;
    regexpVars: {[s: string]: varDef} = {};
    states: CmdArray[] = [new CmdArray('')];

    stateMap: {[s: string]: number} = { DEFAULT: 0 };
    requiringState: {[s: string]: Coroutine<number>[]} = {};
    selectedStates: CmdArray[] = [];
    selectedVar: CmdArray = null;

    // exec
    ar: { pc: number, cmds: CmdArray }[] = [];
    jmp = false;

    constructor(public ctx: Context){

    }

    private _emit(func: (s: StateBuilder<T>) => void){
        if(this.selectedVar !== null){
            this.selectedVar.opcodes.push(func);
        }
        else {
            for(let sn of this.selectedStates){
                sn.opcodes.push(func);
            }
        }
    }
    private _exec(a: CmdArray): DFA<T>{
        this.head = this.currentState = new State<T>();
        this.head.isStart = true;
        this.unionStack.length = 0;
        this.simpleStack.length = 0;
        this.currentArc = null;
        this.isInverse = false;

        this.ar.length = 0;
        this.ar.push({
            pc: 0,
            cmds: a
        });
        while(this.ar.length > 0){
            let top = this.ar[this.ar.length - 1];
            top.cmds.opcodes[top.pc++](this);
            top = this.ar[this.ar.length - 1];
            top.pc >= top.cmds.opcodes.length && this.ar.pop();
        }
        this.head.removeEpsilons();
        var dhead = this.head.toDFA();
        var ret = new DFA<T>(dhead.states);
        return ret;
        //return null;
    }

    prepareVar(vname: string, line: number){
        let vdef = this.regexpVars[vname];
        if(vdef !== undefined){
            this.ctx.err(new CompilationError(`variable "${vname}" was already defined at line ${vdef.line}`, line));
        }
        vdef = this.regexpVars[vname] = {
            line: line,
            cmds: new CmdArray(vname)
        };
        this.selectedVar = vdef.cmds;
    }
    endVar(){
        this.selectedVar = null;
    }

    prepareLex(){
        this.selectedStates.length = 0;
    }
    selectState(s: string){
        var sn = this.stateMap[s];
        if(sn === undefined){
            sn = this.stateMap[s] = this.states.length;
            this.states.push(new CmdArray(''));
            let crs = this.requiringState[s];
            if(crs !== undefined){
                for(let cr of crs){
                    cr.run(sn);
                }
                delete this.requiringState[s];
            }
        }
        // this.stateMap[s] || (this.stateMap[s] = this.states.length, this.states.push(new CmdArray('')));
        this.selectedStates.push(this.states[this.stateMap[s]]);
    }

    requireState(sname: string, cr: Coroutine<number>){
        let sn = this.stateMap[sname];
        if(sn !== undefined){
            cr.run(sn);
        }
        else {
            this.requiringState[sname] || (this.requiringState[sname] = []);
            this.requiringState[sname].push(cr);
        }
    }

    newState(){
        this.first = true;
        this.possibleAlias = null;
        this._emit(cela => {
            cela.currentState = new State<T>();
            cela.head.epsilonTo(cela.currentState);
        });
    }
    end(action: T, label: string = '(untitled)'){
        for(let sn of this.selectedStates){
            sn.label = `<${label}>`;
        }
        this._emit(cela => {
            let ac = new EndAction<T>();
            ac.id = ac.priority = cela.scount++;
            ac.data = action;
            cela.currentState.endAction = ac;
        });
    }

    //#region union
    enterUnion(){
        this._emit(s => {
            s.unionStack.push({
                head: s.currentState,
                tail: new State<T>()
            });
        });
        // this.unionStack.push({
        //     head: this.currentState,
        //     tail: new State<T>()
        // });
    }
    endUnionItem(){
        this._emit(s => {
            let top = s.unionStack[s.unionStack.length - 1];
            s.currentState.epsilonTo(top.tail);
            s.currentState = top.head;
        });
    }
    leaveUnion(){
        this._emit(s => {
            s.currentState = s.unionStack.pop().tail;
        });
    }
    //#endregion

    //#region simple
    enterSimple(){
        this._emit(s => {
            s.simpleStack.push(s.currentState);
        });
    }
    simplePostfix(postfix: '' | '?' | '+' | '*'){
        postfix === '' || (this.possibleAlias = null, this.first = false);
        this._emit(s => {
            let top = s.simpleStack.pop();
            if(postfix === '?'){
                top.epsilonTo(s.currentState);
            }
            else if(postfix === '+'){
                s.currentState.epsilonTo(top);
            }
            else if(postfix === '*'){
                s.currentState.epsilonTo(top);
                s.currentState = top;
            }
        });
    }

    //#region primitive
    addString(s: string){
        if(this.first){
            this.possibleAlias = s;
            this.first = false;
        }
        else {
            this.possibleAlias = null;
        }
        this._emit(cela => {
            for(let i = 0;i < s.length;i++){
                let ns = new State<T>();
                cela.currentState.to(ns).chars.add(s.charCodeAt(i));
                cela.currentState = ns;
            }
        });
    }
    addVar(vname: string, line: number){
        this.first = false;
        this.possibleAlias = null;
        this._emit(cela => {
            let vdef = cela.regexpVars[vname];
            if(vdef === undefined){
                cela.ctx.err(new CompilationError(`use of undefined variable "${vname}"`, line));
            }
            let cmds = vdef.cmds;
            // check for circular dependence
            for(let i = 0;i < cela.ar.length;i++){
                let aitem = cela.ar[i];
                if(aitem.cmds === cmds){
                    let msg = `circular dependence in lexical variable detected: ${cmds.label}`;
                    for(i++;i < cela.ar.length;i++){
                        msg += ` -> ${cela.ar[i].cmds.label}`;
                    }
                    msg += ` -> ${cmds.label}`;
                    cela.ctx.err(new CompilationError(msg, line));
                    // Don't stop executing, for detecting furthur errors.
                    return;
                }
            }
            cela.ar.push({
                pc: 0,
                cmds: cmds
            });
            cela.jmp = true;
        });
    }
    beginSet(inverse: boolean){
        this.first = false;
        this.possibleAlias = null;
        this._emit(cela => {
            cela.isInverse = inverse;
            let ns = new State<T>();
            cela.currentArc = cela.currentState.to(ns);
            cela.currentState = ns;
            inverse && cela.currentArc.chars.addAll();
        });
    }
    addSetItem(from: string, to: string, line1: number, line2: number){
        if(from.length !== 1){
            this.ctx.err(new CompilationError(`character expected in union, got "${from}"`, line1));
            return;
        }
        if(to.length !== 1){
            this.ctx.err(new CompilationError(`character expected in union, got "${to}"`, line2));
            return;
        }
        if(from.charCodeAt(0) > to.charCodeAt(0)){
            this.ctx.err(new CompilationError(
                `left hand side must be larger than right hand side in wild card character (got '${from}' > '${to}')`
            , line1));
        }
        this._emit(cela => {
            cela.isInverse ? 
            cela.currentArc.chars.remove(from.charCodeAt(0), to.charCodeAt(0)) : 
            cela.currentArc.chars.add   (from.charCodeAt(0), to.charCodeAt(0));
        });
    }
    endSet(){
        this._emit(cela => {
            cela.currentArc = null;
        });
    }
    build(): DFA<T>[]{
        let dfas: DFA<T>[] = [];
        for(let state of this.states){
            dfas.push(this._exec(state));
        }
        for(let sname in this.requiringState){
            for(let cr of this.requiringState[sname]){
                cr.fail();
            }
        }
        return dfas;
    }

    //#endregion
    
}