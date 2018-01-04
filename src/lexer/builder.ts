import { State, Arc, EndAction } from './state';
import { Context } from '../util/context';
import { CompilationError } from '../util/E';
import { DFA } from './dfa';
import { Coroutine, CoroutineMgr } from '../util/coroutine';

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
    private _head: State<T> = new State<T>();
    private _currentState: State<T> = null;
    private _unionStack: { head: State<T>, tail: State<T> }[] = [];
    // naive stack    +1s
    private _simpleStack: State<T>[] = [];
    private _currentArc: Arc<T> = null;
    private _isInverse: boolean = false;
    possibleAlias: string = null;
    private _first = false;

    private _scount = 0;
    private _regexpVars: {[s: string]: varDef} = {};
    private _states: CmdArray[] = [new CmdArray('')];

    private _stateMap: {[s: string]: number} = { DEFAULT: 0 };
    requiringState: CoroutineMgr<number>;
    private _selectedStates: CmdArray[] = [];
    private _selectedVar: CmdArray = null;

    // exec
    private _ar: { pc: number, cmds: CmdArray }[] = [];

    constructor(public ctx: Context){
        let cela = this;
        this.requiringState = new CoroutineMgr<number>(s => {
            return cela._stateMap[s];
        });
    }

    private _emit(func: (s: StateBuilder<T>) => void){
        if(this._selectedVar !== null){
            this._selectedVar.opcodes.push(func);
        }
        else {
            for(let sn of this._selectedStates){
                sn.opcodes.push(func);
            }
        }
    }
    private _exec(a: CmdArray): DFA<T>{
        this._head = this._currentState = new State<T>();
        this._head.isStart = true;
        this._unionStack.length = 0;
        this._simpleStack.length = 0;
        this._currentArc = null;
        this._isInverse = false;

        this._ar.length = 0;
        this._ar.push({
            pc: 0,
            cmds: a
        });
        while(this._ar.length > 0){
            let top = this._ar[this._ar.length - 1];
            top.cmds.opcodes[top.pc++](this);
            top = this._ar[this._ar.length - 1];
            top.pc >= top.cmds.opcodes.length && this._ar.pop();
        }
        this._head.removeEpsilons();
        var dhead = this._head.toDFA();
        var ret = new DFA<T>(dhead.states);
        return ret;
        //return null;
    }

    prepareVar(vname: string, line: number){
        let vdef = this._regexpVars[vname];
        if(vdef !== undefined){
            this.ctx.err(new CompilationError(`variable "${vname}" was already defined at line ${vdef.line}`, line));
        }
        vdef = this._regexpVars[vname] = {
            line: line,
            cmds: new CmdArray(vname)
        };
        this._selectedVar = vdef.cmds;
    }
    endVar(){
        this._selectedVar = null;
    }

    prepareLex(){
        this._selectedStates.length = 0;
    }
    selectState(s: string){
        var sn = this._stateMap[s];
        if(sn === undefined){
            sn = this._stateMap[s] = this._states.length;
            this._states.push(new CmdArray(''));
            this.requiringState.signal(s, sn);
        }
        this._selectedStates.push(this._states[this._stateMap[s]]);
    }

    newState(){
        this._first = true;
        this.possibleAlias = null;
        this._emit(cela => {
            cela._currentState = new State<T>();
            cela._head.epsilonTo(cela._currentState);
        });
    }
    end(action: T, label: string = '(untitled)'){
        for(let sn of this._selectedStates){
            sn.label = `<${label}>`;
        }
        this._emit(cela => {
            let ac = new EndAction<T>();
            ac.id = ac.priority = cela._scount++;
            ac.data = action;
            cela._currentState.endAction = ac;
        });
    }

    //#region union
    enterUnion(){
        this._emit(s => {
            s._unionStack.push({
                head: s._currentState,
                tail: new State<T>()
            });
        });
    }
    endUnionItem(){
        this._emit(s => {
            let top = s._unionStack[s._unionStack.length - 1];
            s._currentState.epsilonTo(top.tail);
            s._currentState = top.head;
        });
    }
    leaveUnion(){
        this._emit(s => {
            s._currentState = s._unionStack.pop().tail;
        });
    }
    //#endregion

    //#region simple
    enterSimple(){
        this._emit(s => {
            s._simpleStack.push(s._currentState);
        });
    }
    simplePostfix(postfix: '' | '?' | '+' | '*'){
        postfix === '' || (this.possibleAlias = null, this._first = false);
        this._emit(s => {
            let top = s._simpleStack.pop();
            if(postfix === '?'){
                top.epsilonTo(s._currentState);
            }
            else if(postfix === '+'){
                s._currentState.epsilonTo(top);
            }
            else if(postfix === '*'){
                s._currentState.epsilonTo(top);
                s._currentState = top;
            }
        });
    }

    //#region primitive
    addString(s: string){
        if(this._first){
            this.possibleAlias = s;
            this._first = false;
        }
        else {
            this.possibleAlias = null;
        }
        this._emit(cela => {
            for(let i = 0;i < s.length;i++){
                let ns = new State<T>();
                cela._currentState.to(ns).chars.add(s.charCodeAt(i));
                cela._currentState = ns;
            }
        });
    }
    addVar(vname: string, line: number){
        this._first = false;
        this.possibleAlias = null;
        this._emit(cela => {
            let vdef = cela._regexpVars[vname];
            if(vdef === undefined){
                cela.ctx.err(new CompilationError(`use of undefined variable "${vname}"`, line));
            }
            let cmds = vdef.cmds;
            // check for circular dependence
            for(let i = 0;i < cela._ar.length;i++){
                let aitem = cela._ar[i];
                if(aitem.cmds === cmds){
                    let msg = `circular dependence in lexical variable detected: ${cmds.label}`;
                    for(i++;i < cela._ar.length;i++){
                        msg += ` -> ${cela._ar[i].cmds.label}`;
                    }
                    msg += ` -> ${cmds.label}`;
                    cela.ctx.err(new CompilationError(msg, line));
                    // Don't stop executing, for detecting furthur errors.
                    return;
                }
            }
            cela._ar.push({
                pc: 0,
                cmds: cmds
            });
        });
    }
    beginSet(inverse: boolean){
        this._first = false;
        this.possibleAlias = null;
        this._emit(cela => {
            cela._isInverse = inverse;
            let ns = new State<T>();
            cela._currentArc = cela._currentState.to(ns);
            cela._currentState = ns;
            inverse && cela._currentArc.chars.addAll();
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
            cela._isInverse ? 
            cela._currentArc.chars.remove(from.charCodeAt(0), to.charCodeAt(0)) : 
            cela._currentArc.chars.add   (from.charCodeAt(0), to.charCodeAt(0));
        });
    }
    endSet(){
        this._emit(cela => {
            cela._currentArc = null;
        });
    }
    build(): DFA<T>[]{
        let dfas: DFA<T>[] = [];
        for(let state of this._states){
            dfas.push(this._exec(state));
        }
        this.requiringState.fail();
        return dfas;
    }

    //#endregion
    
}