import { TemplateInput, TemplateOutput } from '../def';
import { Item, Action } from '../../grammar/item-set';
import { Rule } from '../../grammar/grammar';
import { TokenDef } from '../../grammar/token-entry';
import { CodeGenerator } from '../code-generator';
import { DFA } from '../../lexer/dfa';
import { LexAction } from '../../lexer/action';
import { State, Arc } from '../../lexer/state';
import { Inf } from '../../util/interval-set';

export default function(input: TemplateInput, output: TemplateOutput){
    echoLine("/*");
    echoLine("    generated by jscc, an LALR(1) parser generator made by hadroncfy.");
    echoLine("    template for typescript, written by hadroncfy, aussi.");
    echoLine("*/");
    echo(input.header );
    let prefix = input.prefix;
let tab = input.opt.tab || '    ';
function echo(s: string | number){
    output.write(s);
}
function echoLine(s: string | number){
    output.writeln(s);
}
function leftAlign(s: string, al: number): string{
    function repeat(s: string, t: number){
        let ret = '';
        while(t --> 0) ret += s;
        return ret;
    }
    return (s.length < al ? repeat(' ', al - s.length) : '') + s;
}
function printTable<T>(tname: string, t: T[], align: number, lc: number, mapper: (d: T) => string){
    let count = 1; 
    echoLine("");
    echo("let ");
    echo(prefix + tname );
    echoLine(" = [ ");
    echo(tab); 
    for(let i of t){
        echo(leftAlign(mapper(i), align));
        echo(',');
        count++ >= lc && (count = 1, echo(input.endl + tab));
    } 
    echoLine("");
    echo("]; ");
    } 
function printState(state: State<LexAction[]>){ 
    function arcToString(arc: Arc<LexAction[]>): string{
        let ret: string[] = [];
        arc.chars.forEach((from, to) => {
            if(from === to){
                ret.push(`c === ${from}`);
            }
            else if(from === 0 && to !== Inf.oo){
                ret.push(`c <= ${to}`);
            }
            else if(from !== 0 && to === Inf.oo){
                ret.push(`c >= ${from}`);
            }
            else if(from !== 0 && to !== Inf.oo){
                ret.push(`(c >= ${from} && c <= ${to})`);
            }
            else {
                // this merely happens
                ret.push('true');
            }
        });
        return ret.join(' || ');
    } 
    let first = true; 
    echoLine("");
    echo("        case ");
    echo(state.index );
    echoLine(":");
    echo("            ret.hasArc = ");
    echo(state.arcs.length > 0 ? 'true' : 'false' );
    echoLine(";");
    echo("            ret.isEnd = ");
    echo(state.endAction === null ? 'false' : 'true' );
    echo(";");
    for(let arc of state.arcs){
        if(first) { 
    echoLine("");
    echo("            if(");
    echo(arcToString(arc) );
    echoLine("){");
    echo("                ret.state = ");
    echo(arc.to.index );
    echoLine(";");
    echo("            }");
    first = false;
        } else { 
    echoLine("");
    echo("            else if(");
    echo(arcToString(arc) );
    echoLine("){");
    echo("                ret.state = ");
    echo(arc.to.index );
    echoLine(";");
    echo("            }");
    }
    } 
    if(state.arcs.length === 0) { 
    echoLine("");
    echo("            ret.state = -1;");
    } else { 
    echoLine("");
    echoLine("            else {");
    echoLine("                ret.state = -1;");
    echo("            }");
    } 
    echoLine("");
    echo("            break;");
    } 
function printDFA(dfa: DFA<LexAction[]>, n: number){ 
    echoLine("");
    echo("function moveDFA");
    echo(n );
    echoLine("(c: number, ret: { state: number, hasArc: boolean, isEnd: boolean }){");
    echo("    switch(ret.state){");
    for(let state of dfa.states){
        printState(state);
    } 
    echoLine("");
    echoLine("        default:");
    echoLine("            ret.state = -1;");
    echoLine("            ret.hasArc = false;");
    echoLine("    }");
    echo("}");
    }
function printLexTokens(dfa: DFA<LexAction[]>, n: number){
    function getAction(act: LexAction[]): number{
        for(let a of act){
            if(a.token !== -1){
                return a.token;
            }
        }
        return -1;
    }
    printTable<State<LexAction[]>>('lexTokens' + n, dfa.states, 6, 10, (state) => {
        return state.endAction ? getAction(state.endAction.data).toString() : '-1';
    });
} 
    echoLine("");
    echoLine("");
    echoLine("/*");
    echoLine("    find the next state to go in the dfa");
    echo("*/");
    for(let i = 0, _a = input.dfas; i < _a.length; i++){
    printDFA(_a[i], i);
} 
    echoLine("");
    echoLine("");
    echoLine("/*");
    echoLine("    all the lexer data goes here.");
    echoLine("*/");
    echo("let ");
    echo(prefix );
    echo("lexers = [");
    for(let i = 0;i < input.dfas.length;i++){ 
    echoLine("");
    echo("    moveDFA");
    echo(i );
    echo(",");
    } 
    echoLine("");
    echoLine("];");
    echoLine("");
    echoLine("/*");
    echoLine("    tokens that a lexical dfa state can return");
    echo("*/");
    for(let i = 0, _a = input.dfas; i < _a.length; i++){
    printLexTokens(_a[i], i);
} 
    echoLine("");
    let pt = input.pt; 
    echoLine("");
    echo("let ");
    echo(prefix );
    echo("stateCount = ");
    echo(pt.stateCount );
    echoLine(";");
    echoLine("/*");
    echo("    compressed action table: action = ");
    echo(prefix );
    echo("pact[");
    echo(prefix );
    echoLine("disact[STATE-NUM] + TOKEN]");
    echoLine("    when action > 0, shift the token and goto state (action - 1);");
    echoLine("    when action < 0, reduce with rule (1-action);");
    echoLine("    when action = 0, do default action.");
    echo("*/");
    printTable<Item>('pact', pt.pact, 6, 10, t => {
    if(t === null || t === Item.NULL){
        return '0';
    }
    else if(t.actionType === Action.SHIFT){
        return (t.shift.stateIndex + 1).toString();
    }
    else if(t.actionType === Action.REDUCE){
        return (-t.rule.index - 1).toString();
    }
}); 
    echoLine("");
    echoLine("/*");
    echoLine("    displacement of action table.");
    echo("*/");
    printTable<number>('disact', pt.disact, 6, 10, t => t.toString()); 
    echoLine("");
    echoLine("/*");
    echo("    used to check if a position in ");
    echo(prefix  );
    echoLine("pact is out of bouds.");
    echo("    if ");
    echo(prefix  );
    echo("checkact[");
    echo(prefix );
    echoLine("disact[STATE-NUM] + TOKEN] = STATE-NUM, this position is not out of bounds.");
    echo("*/");
    printTable<number>('checkact', pt.checkact, 6, 10, t => t === undefined ? '0' : t.toString()); 
    echoLine("");
    echoLine("/*");
    echo("    default action table. action = ");
    echo(prefix );
    echoLine("defred[STATE-NUM],");
    echoLine("    where action is the number of the rule to reduce with.");
    echo("*/");
    printTable<number>('defred', pt.defred, 6, 10, t => t.toString()); 
    echoLine("");
    echoLine("/*");
    echo("    compressed goto table: goto = ");
    echo(prefix  );
    echo("pgoto[");
    echo(prefix );
    echoLine("disgoto[STATE-NUM] + NON_TERMINAL]");
    echo("*/");
    printTable<Item>('pgoto', pt.pgoto, 6, 10, t => {
    if(t === null){
        return '-1';
    }
    else {
        return t.shift.stateIndex.toString();
    }
}); 
    echoLine("");
    echoLine("/*");
    echoLine("    displacement of the goto table");
    echo("*/");
    printTable<number>('disgoto', pt.disgoto, 6, 10, t => t.toString()); 
    echoLine("");
    echoLine("/*");
    echo("    length of each rule: rule length = ");
    echo(prefix );
    echoLine("ruleLen[RULE-NUM]");
    echo("*/");
    printTable<Rule>('ruleLen', pt.g.rules, 6, 10, r => r.rhs.length.toString()); 
    echoLine("");
    echoLine("/*");
    echoLine("    index of the LHS of each rule");
    echo("*/");
    printTable<Rule>('lhs', pt.g.rules, 6, 10, r => r.lhs.index.toString()); 
    echoLine("");
    echoLine("/*");
    echoLine("    token names");
    echo("*/");
    printTable<TokenDef>('tokenNames', pt.g.tokens, 20, 3, t => `"${t.sym}"`); 
    echoLine("");
    echoLine("/*");
    echoLine("    token alias");
    echo("*/");
    printTable<TokenDef>('tokenAlias', pt.g.tokens, 20, 3, t => `"${t.alias}"` || '""'); 
    let className = input.opt.className || 'Parser'; 
    echoLine("");
    function printLexActionsFunc(dfa: DFA<LexAction[]>, n: number){
    let codegen = {
        addBlock(b: string, line: number){ 
    echoLine("");
    echo("                ");
    echo(b );
    },
        pushLexState(n: number){ 
    echoLine("");
    echo("                this._lexState.push(");
    echo(n );
    echo(");");
    },
        popLexState(){ 
    echoLine("");
    echo("                this._lexState.pop();");
    },
        setImg(n: string){ 
    echoLine("");
    echo("                this._setImg(\"");
    echo(n );
    echo("\");");
    },
        returnToken(t: TokenDef){ 
    echoLine("");
    echoLine("                this._token = {");
    echo("                    id: ");
    echo(t.index );
    echoLine(",");
    echoLine("                    val: this._matched.join('')");
    echo("                };");
    }
    }; 
    function hasNormalAction(a: LexAction[]){
        for(let act of a){
            if(act.token === -1){
                return true;
            }
        }
        return false;
    }
    let statevn = prefix + 'staten'; 
    echoLine("");
    echo("    private _doLexAction");
    echo(n );
    echo("(");
    echo(statevn );
    echoLine(": number){");
    echo("        let ");
    echo(prefix );
    echo("tk = ");
    echo(prefix );
    echo("lexTokens");
    echo(n );
    echo("[");
    echo(statevn );
    echoLine("];");
    echo("        switch(");
    echo(statevn );
    echo("){");
    for(let i = 0, _a = dfa.states; i < _a.length; i++){ 
        if(_a[i].endAction !== null && hasNormalAction(_a[i].endAction.data)){ 
    echoLine("");
    echo("            case ");
    echo(i );
    echo(":");
    for(let act of _a[i].endAction.data){
                act.token === -1 && act.toCode(codegen);
            } 
    echoLine("");
    echo("                break;");
    }
    } 
    echoLine("");
    echoLine("            default:;");
    echoLine("        }");
    echo("        ");
    echo(prefix );
    echo("tk !== -1 && this._returnToken(");
    echo(prefix );
    echoLine("tk);");
    echo("    }");
    } 
    echoLine("");
    echoLine("");
    echoLine("interface Token{");
    echoLine("    id: number;");
    echoLine("    val: string;");
    echoLine("");
    echoLine("    startLine: number;");
    echoLine("    startColumn: number;");
    echoLine("    endLine: number;");
    echoLine("    endColumn: number;");
    echoLine("};");
    echoLine("");
    echo("export class ");
    echo(className );
    echoLine(" {");
    echoLine("    // members for lexer");
    echoLine("    private _lexState: number[];");
    echoLine("    private _state: number;");
    echoLine("    private _matched: string[];");
    echoLine("    private _token: Token;");
    echoLine("    private _marker: number;");
    echoLine("    private _markerLine;");
    echoLine("    private _markerColumn;");
    echoLine("    private _backupCount: number;");
    echoLine("    private _inputBuf: string[] = [];");
    echoLine("    private _line: number;");
    echoLine("    private _column: number;");
    echoLine("    private _tline: number;");
    echoLine("    private _tcolumn: number;");
    echoLine("");
    echoLine("    // members for parser");
    echoLine("    private _lrState: number[] = [];");
    echoLine("    private _sematicS: any[] = [];");
    echoLine("    private _accepted: boolean;");
    echoLine("");
    echoLine("    private _handlers: {[s: string]: ((a1?, a2?, a3?) => any)[]} = {};");
    echoLine("");
    echoLine("    // extra members, defined by %extra_arg");
    echo("    ");
    echo(input.extraArg );
    echoLine("");
    echoLine("");
    echoLine("    constructor(){");
    echoLine("        this.init();");
    echoLine("    }");
    echoLine("    init(){");
    echoLine("        this._lexState = [ 0 ];// DEFAULT");
    echoLine("        this._state = 0;");
    echoLine("        this._matched = [];");
    echoLine("        this._token = null;");
    echoLine("        this._marker = -1;");
    echoLine("        this._markerLine = this._markerColumn = 0;");
    echoLine("        this._backupCount = 0;");
    echoLine("        this._inputBuf = [];");
    echoLine("        this._line = this._tline = 0;");
    echoLine("        this._column = this._tcolumn = 0;");
    echoLine("        ");
    echoLine("        this._lrState = [ 0 ];");
    echoLine("        this._sematicS = [];");
    echoLine("        this._accepted = false;");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  set ");
    echoLine("     */");
    echoLine("    private _setImg(s: string){");
    echoLine("        this._matched.length = 0;");
    echoLine("        for(let i = 0;i < s.length;i++){");
    echoLine("            this._matched.push(s.charAt(i));");
    echoLine("        }");
    echoLine("        this._tline = this._line;");
    echoLine("        this._tcolumn = this._column;");
    echoLine("    }");
    echoLine("    private _returnToken(tid: number){");
    echoLine("        this._token = {");
    echoLine("            id: tid,");
    echoLine("            val: this._matched.join(''),");
    echoLine("            startLine: this._tline,");
    echoLine("            startColumn: this._tcolumn,");
    echoLine("            endLine: this._line,");
    echoLine("            endColumn: this._column");
    echoLine("        }");
    echoLine("        this._matched.length = 0;");
    echoLine("        this._tline = this._line;");
    echoLine("        this._tcolumn = this._column;");
    echo("        this._emit('token', ");
    echo(prefix );
    echoLine("tokenNames[this._token.id], this._token.val);");
    echoLine("        while(!this._acceptToken(this._token));");
    echoLine("        this._token = null;");
    echoLine("    }");
    echoLine("    private _emit(name: string, a1?, a2?, a3?){");
    echoLine("        let cbs = this._handlers[name];");
    echoLine("        if(cbs){");
    echoLine("            for(let cb of cbs){");
    echoLine("                cb(a1, a2, a3);");
    echoLine("            }");
    echoLine("        }");
    echoLine("    }");
    echoLine("    on(name: string, cb: (a1?, a2?, a3?) => any){");
    echoLine("        this._handlers[name] || (this._handlers[name] = []);");
    echoLine("        this._handlers[name].push(cb);");
    echo("    }");
    for(let i = 0, _a = input.dfas; i < _a.length; i++){
    printLexActionsFunc(_a[i], i);
} 
    echoLine("");
    echoLine("    /**");
    echoLine("     *  do a lexical action");
    echoLine("     *  @api private");
    echoLine("     *  @internal");
    echoLine("     */");
    echoLine("    private _doLexAction(lexstate: number, state: number){");
    echo("        switch(lexstate){");
    for(let i = 0;i < input.dfas.length;i++){ 
    echoLine("");
    echo("            case ");
    echo(i );
    echoLine(":");
    echo("                this._doLexAction");
    echo(i );
    echoLine("(state);");
    echo("                break;");
    } 
    echoLine("");
    echoLine("            default:;");
    echoLine("        }");
    echoLine("        this._token !== null && (this._acceptToken(this._token), (this._token = null));");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  accept a character");
    echoLine("     *  @return - true if the character is consumed, false if not consumed");
    echoLine("     *  @api private");
    echoLine("     *  @internal");
    echoLine("     */");
    echoLine("    private _acceptChar(c: string){");
    echoLine("        let lexstate = this._lexState[this._lexState.length - 1];");
    echoLine("        let retn = { state: this._state, hasArc: false, isEnd: false };");
    echo("        ");
    echo(prefix );
    echoLine("lexers[lexstate](c.charCodeAt(0), retn);");
    echoLine("        if(retn.isEnd){");
    echoLine("            // if current state is a terminate state, be careful");
    echoLine("            if(retn.hasArc){");
    echoLine("                if(retn.state === -1){");
    echoLine("                    // nowhere to go, stay where we are");
    echoLine("                    this._doLexAction(lexstate, this._state);");
    echoLine("                    // recover");
    echoLine("                    this._marker = -1;");
    echoLine("                    this._backupCount = 0;");
    echoLine("                    this._state = 0;                    ");
    echoLine("                    // character not consumed");
    echoLine("                    return false;");
    echoLine("                }");
    echoLine("                else {");
    echoLine("                    // now we can either go to that new state, or stay where we are");
    echoLine("                    // it is prefered to move forward, but that could lead to errors,");
    echoLine("                    // so we need to memorize this state before move on, in case if ");
    echoLine("                    // an error occurs later, we could just return to this state.");
    echoLine("                    this._marker = this._state;");
    echoLine("                    this._markerLine = this._line;");
    echoLine("                    this._markerColumn = this._column;");
    echoLine("                    this._state = retn.state;");
    echoLine("                    this._backupCount = 1;");
    echoLine("                    this._matched.push(c);");
    echoLine("                    c === '\\n' ? (this._line++, this._column = 0) : (this._column++);");
    echoLine("                    // character consumed");
    echoLine("                    return true;");
    echoLine("                }");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                // current state doesn't lead to any state, just stay here.");
    echoLine("                this._doLexAction(lexstate, this._state);");
    echoLine("                // recover");
    echoLine("                this._marker = -1;");
    echoLine("                this._backupCount = 0;");
    echoLine("                this._state = 0;");
    echoLine("                // character not consumed");
    echoLine("                return false;");
    echoLine("            }");
    echoLine("        }");
    echoLine("        else {");
    echoLine("            if(retn.state === -1){");
    echoLine("                // nowhere to go at current state, error may have occured.");
    echoLine("                // check marker to verify that");
    echoLine("                if(this._marker !== -1){");
    echoLine("                    // we have a previously marked state, which is a terminate state.");
    echoLine("                    // rollback");
    echoLine("                    this._state = this._marker;");
    echoLine("                    this._marker = -1;");
    echoLine("                    this._line = this._markerLine;");
    echoLine("                    this._column = this._markerColumn;");
    echoLine("                    while(this._backupCount --> 0){");
    echoLine("                        this._inputBuf.push(this._matched.pop());");
    echoLine("                    }");
    echoLine("                    this._doLexAction(lexstate, this._state);");
    echoLine("                    this._state = 0;");
    echoLine("                    // character not consumed");
    echoLine("                    return false;");
    echoLine("                }");
    echoLine("                else {");
    echoLine("                    // error occurs");
    echoLine("                    this._emit('lexicalerror', `unexpected character \"${c}\"`);");
    echoLine("                    // force consume");
    echoLine("                    return true;");
    echoLine("                }");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                this._state = retn.state;");
    echoLine("                c === '\\n' ? (this._line++, this._column = 0) : (this._column++);");
    echoLine("                // character consumed");
    echoLine("                return true;");
    echoLine("            }");
    echoLine("        }");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  input a string");
    echoLine("     *  @api public");
    echoLine("     */");
    echoLine("    accept(s: string){");
    echoLine("        for(let i = s.length - 1; i >= 0; i--){");
    echoLine("            this._inputBuf.push(s.charAt(i));");
    echoLine("        }");
    echoLine("        while(this._inputBuf.length > 0){");
    echoLine("            this._acceptChar(this._inputBuf[this._inputBuf.length - 1]) && this._inputBuf.pop();");
    echoLine("        }");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  tell the compiler that end of file is reached");
    echoLine("     *  @api public");
    echoLine("     */");
    echoLine("    end(){");
    echoLine("        this._returnToken(0);");
    echo("    }");
    function printReduceActions(){
    let codegen = {
        addBlock(b: string, line: number){ 
    echoLine("");
    echo("                {");
    echo(b.replace(/\$\$/g, prefix + 'top') );
    echo("}");
    },
        pushLexState(n: number){ 
    echoLine("");
    echo("                this._lexState.push(");
    echo(n );
    echo(");");
    },
        popLexState(){ 
    echoLine("");
    echo("                this._lexState.pop();");
    },
        setImg(n: string){ 
    echoLine("");
    echo("                this._setImg(\"");
    echo(n );
    echo("\");");
    },
        returnToken(t: TokenDef){ 
    echoLine("");
    echoLine("                this._token = {");
    echo("                    id: ");
    echo(t.index );
    echoLine(",");
    echoLine("                    val: this._matched.join('')");
    echo("                };");
    }
    };
    for(let rule of input.g.rules){
        if(rule.action !== null){ 
    echoLine("");
    echo("            case ");
    echo(rule.index );
    echoLine(":");
    echo("                /* ");
    echo(rule.toString() );
    echo(" */");
    for(let uvar in rule.vars){ 
    echoLine("");
    echo("                var ");
    echo(uvar );
    echo(" = this._sematicS[");
    echo(prefix );
    echo("sp - ");
    echo(rule.rhs.length - rule.vars[uvar].val );
    echo("];");
    }
            for(let uvar2 in rule.usedVars){ 
    echoLine("");
    echo("                var ");
    echo(uvar2 );
    echo(" = this._sematicS[");
    echo(prefix );
    echo("sp - ");
    echo(rule.usedVars[uvar2].val );
    echo("];");
    }
            for(let act of rule.action){
                act.toCode(codegen);
            } 
    echoLine("");
    echo("                break;");
    }
    }
} 
    echoLine("");
    echo("    private _doReduction(");
    echo(prefix );
    echoLine("rulenum: number){");
    echo("        let ");
    echo(prefix );
    echo("nt = ");
    echo(prefix );
    echo("lhs[");
    echo(prefix );
    echoLine("rulenum];");
    echo("        let ");
    echo(prefix );
    echoLine("sp = this._sematicS.length;");
    echo("        let ");
    echo(prefix );
    echo("top = this._sematicS[");
    echo(prefix );
    echo("sp - ");
    echo(prefix );
    echo("ruleLen[");
    echo(prefix );
    echoLine("rulenum]];");
    echo("        switch(");
    echo(prefix );
    echo("rulenum){");
    printReduceActions(); 
    echoLine("");
    echoLine("        }");
    echo("        this._lrState.length -= ");
    echo(prefix );
    echo("ruleLen[");
    echo(prefix );
    echoLine("rulenum];");
    echo("        let ");
    echo(prefix );
    echoLine("cstate = this._lrState[this._lrState.length - 1];");
    echo("        this._lrState.push(");
    echo(prefix );
    echo("pgoto[");
    echo(prefix );
    echo("disgoto[");
    echo(prefix );
    echo("cstate] + ");
    echo(prefix );
    echoLine("nt]);");
    echoLine("");
    echo("        this._sematicS.length -= ");
    echo(prefix );
    echo("ruleLen[");
    echo(prefix );
    echoLine("rulenum];");
    echo("        this._sematicS.push(");
    echo(prefix );
    echoLine("top);");
    echoLine("    }");
    echoLine("");
    echoLine("    private _acceptToken(t: Token){");
    echoLine("        // look up action table");
    echoLine("        let cstate = this._lrState[this._lrState.length - 1];");
    echo("        let ind = ");
    echo(prefix );
    echoLine("disact[cstate] + t.id;");
    echoLine("        let act = 0;");
    echo("        if(ind < 0 || ind >= ");
    echo(prefix );
    echo("pact.length || ");
    echo(prefix );
    echoLine("checkact[ind] !== cstate){");
    echo("            act = -");
    echo(prefix );
    echoLine("defred[cstate] - 1;");
    echoLine("        }");
    echoLine("        else {");
    echo("            act = ");
    echo(prefix );
    echoLine("pact[ind];");
    echoLine("        }");
    echoLine("        if(act > 0){");
    echoLine("            // shift");
    echoLine("            if(t.id === 0){");
    echoLine("                // end of file");
    echoLine("                this._accepted = true;");
    echoLine("                this._emit('accept');");
    echoLine("                return false;");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                this._lrState.push(act - 1);");
    echoLine("                this._sematicS.push(t);");
    echoLine("                // token consumed");
    echoLine("                return true;");
    echoLine("            }");
    echoLine("        }");
    echoLine("        else if(act < 0){");
    echoLine("            this._doReduction(-act - 1);");
    echoLine("        }");
    echoLine("        else {");
    echoLine("            // error");
    echo("            this._emit(\"syntaxerror\", `unexpected token ${");
    echo(prefix );
    echoLine("tokenNames[t.id]}`);");
    echoLine("            // force consume");
    echoLine("            return true;");
    echoLine("        }");
    echoLine("    }");
    echo("}");
    

}