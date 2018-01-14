import { State, Arc, EndAction } from './state';
import { Context } from '../util/context';
import { CompilationError } from '../util/E';
import { DFA } from './dfa';
import { Coroutine, CoroutineMgr } from '../util/coroutine';
import { LexAction } from './action';

class CmdArray{
    opcodes: (() => void)[] = [];
    constructor(public label: string){}
}

interface varDef{
    line: number;
    cmds: CmdArray;
};
export interface LexBuilder<T>{
    prepareVar(vname: string, line: number);
    endVar();
    prepareLex();
    selectState(s: string);
    newState();
    end(action: T, label: string);
    enterUnion();
    endUnionItem();
    leaveUnion();
    enterSimple();
    simplePostfix(postfix: '' | '?' | '+' | '*');
    addString(s: string);
    addVar(vname: string, line: number);
    beginSet(inverse: boolean);
    addSetItem(from: string, to: string, line1: number, line2: number);
    endSet();
    build(): DFA<T>[];
    getPossibleAlias(): string;
    readonly requiringState: CoroutineMgr<number>;
}

export function createLexBuilder<T>(ctx: Context): LexBuilder<T>{
    let _head: State<T> = new State<T>();
    let _currentState: State<T> = null;
    let _unionStack: { head: State<T>, tail: State<T> }[] = [];
    // naive stack    +1s
    let  _simpleStack: State<T>[] = [];
    let _currentArc: Arc<T> = null;
    let _isInverse: boolean = false;
    let possibleAlias: string = null;
    let _first = false;

    let _scount = 0;
    let _regexpVars: {[s: string]: varDef} = {};
    let _states: CmdArray[] = [new CmdArray('')];

    let _stateMap: {[s: string]: number} = { DEFAULT: 0 };
    let requiringState: CoroutineMgr<number>;
    let _selectedStates: CmdArray[] = [];
    let _selectedVar: CmdArray = null;

    // exec
    let _ar: { pc: number, cmds: CmdArray }[] = [];

    requiringState = new CoroutineMgr<number>(s => _stateMap[s]);
    return {
        prepareVar,
        endVar,
        prepareLex,
        selectState,
        newState,
        end,
        enterUnion,
        endUnionItem,
        leaveUnion,
        enterSimple,
        simplePostfix,
        addString,
        addVar,
        beginSet,
        addSetItem,
        endSet,
        build,
        getPossibleAlias: () => possibleAlias,
        requiringState
    };

    function _emit(func: () => void){
        if(_selectedVar !== null){
            _selectedVar.opcodes.push(func);
        }
        else {
            for(let sn of _selectedStates){
                sn.opcodes.push(func);
            }
        }
    }
    function _exec(a: CmdArray): DFA<T>{
        _head = _currentState = new State<T>();
        _head.isStart = true;
        _unionStack.length = 0;
        _simpleStack.length = 0;
        _currentArc = null;
        _isInverse = false;

        _ar.length = 0;
        _ar.push({
            pc: 0,
            cmds: a
        });
        while(_ar.length > 0){
            let top = _ar[_ar.length - 1];
            top.cmds.opcodes[top.pc++]();
            top = _ar[_ar.length - 1];
            top.pc >= top.cmds.opcodes.length && _ar.pop();
        }
        _head.removeEpsilons();
        var dhead = _head.toDFA();
        var ret = new DFA<T>(dhead.states);
        return ret;
        //return null;
    }

    function prepareVar(vname: string, line: number){
        let vdef = _regexpVars[vname];
        if(vdef !== undefined){
            ctx.err(new CompilationError(`variable "${vname}" was already defined at line ${vdef.line}`, line));
        }
        vdef = _regexpVars[vname] = {
            line: line,
            cmds: new CmdArray(vname)
        };
        _selectedVar = vdef.cmds;
    }
    function endVar(){
        _selectedVar = null;
    }

    function prepareLex(){
        _selectedStates.length = 0;
    }
    function selectState(s: string){
        var sn = _stateMap[s];
        if(sn === undefined){
            sn = _stateMap[s] = _states.length;
            _states.push(new CmdArray(''));
            requiringState.signal(s, sn);
        }
        _selectedStates.push(_states[_stateMap[s]]);
    }

    function newState(){
        _first = true;
        possibleAlias = null;
        _emit(() => {
            _currentState = new State<T>();
            _head.epsilonTo(_currentState);
        });
    }
    function end(action: T, label: string = '(untitled)'){
        for(let sn of _selectedStates){
            sn.label = `<${label}>`;
        }
        _emit(() => {
            let ac = new EndAction<T>();
            ac.id = ac.priority = _scount++;
            ac.data = action;
            _currentState.endAction = ac;
        });
    }

    //#region union
    function enterUnion(){
        _emit(() => {
            _unionStack.push({
                head: _currentState,
                tail: new State<T>()
            });
        });
    }
    function endUnionItem(){
        _emit(() => {
            let top = _unionStack[_unionStack.length - 1];
            _currentState.epsilonTo(top.tail);
            _currentState = top.head;
        });
    }
    function leaveUnion(){
        _emit(() => {
            _currentState = _unionStack.pop().tail;
        });
    }
    //#endregion

    //#region simple
    function enterSimple(){
        _emit(() => {
            _simpleStack.push(_currentState);
        });
    }
    function simplePostfix(postfix: '' | '?' | '+' | '*'){
        postfix === '' || (possibleAlias = null, _first = false);
        _emit(() => {
            let top = _simpleStack.pop();
            if(postfix === '?'){
                top.epsilonTo(_currentState);
            }
            else if(postfix === '+'){
                _currentState.epsilonTo(top);
            }
            else if(postfix === '*'){
                _currentState.epsilonTo(top);
                _currentState = top;
            }
        });
    }

    //#region primitive
    function addString(s: string){
        if(_first){
            possibleAlias = s;
            _first = false;
        }
        else {
            possibleAlias = null;
        }
        _emit(() => {
            for(let i = 0;i < s.length;i++){
                let ns = new State<T>();
                _currentState.to(ns).chars.add(s.charCodeAt(i));
                _currentState = ns;
            }
        });
    }
    function addVar(vname: string, line: number){
        _first = false;
        possibleAlias = null;
        _emit(() => {
            let vdef = _regexpVars[vname];
            if(vdef === undefined){
                ctx.err(new CompilationError(`use of undefined variable "${vname}"`, line));
            }
            let cmds = vdef.cmds;
            // check for circular dependence
            for(let i = 0;i < _ar.length;i++){
                let aitem = _ar[i];
                if(aitem.cmds === cmds){
                    let msg = `circular dependence in lexical variable detected: ${cmds.label}`;
                    for(i++;i < _ar.length;i++){
                        msg += ` -> ${_ar[i].cmds.label}`;
                    }
                    msg += ` -> ${cmds.label}`;
                    ctx.err(new CompilationError(msg, line));
                    // Don't stop executing, for detecting furthur errors.
                    return;
                }
            }
            _ar.push({
                pc: 0,
                cmds: cmds
            });
        });
    }
    function beginSet(inverse: boolean){
        _first = false;
        possibleAlias = null;
        _emit(() => {
            _isInverse = inverse;
            let ns = new State<T>();
            _currentArc = _currentState.to(ns);
            _currentState = ns;
            inverse && _currentArc.chars.addAll();
        });
    }
    function addSetItem(from: string, to: string, line1: number, line2: number){
        if(from.length !== 1){
            ctx.err(new CompilationError(`character expected in union, got "${from}"`, line1));
            return;
        }
        if(to.length !== 1){
            ctx.err(new CompilationError(`character expected in union, got "${to}"`, line2));
            return;
        }
        if(from.charCodeAt(0) > to.charCodeAt(0)){
            ctx.err(new CompilationError(
                `left hand side must be larger than right hand side in wild card character (got '${from}' > '${to}')`
            , line1));
        }
        _emit(() => {
            _isInverse ? 
            _currentArc.chars.remove(from.charCodeAt(0), to.charCodeAt(0)) : 
            _currentArc.chars.add   (from.charCodeAt(0), to.charCodeAt(0));
        });
    }
    function endSet(){
        _emit(() => {
            _currentArc = null;
        });
    }

    function build(): DFA<T>[]{
        let dfas: DFA<T>[] = [];
        for(let state of _states){
            dfas.push(_exec(state));
        }
        requiringState.fail();
        return dfas;
    }

    //#endregion
    
}