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
    echo("let ");
    echo(prefix );
    echo("tokenCount = ");
    echo(input.g.tokens.length );
    echoLine(";");
    echo("let ");
    echo(prefix );
    echo("actERR = ");
    echo(pt.stateCount + 1 );
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
    if(t === null){
        return '0';
    }
    else if(t === Item.NULL){
        return String(pt.stateCount + 1);
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
    printTable<TokenDef>('tokenAlias', pt.g.tokens, 20, 3, t => t.alias ? `"${t.alias}"` : "null"); 
    let className = input.opt.className || 'Parser'; 
    echoLine("");
    function printLexActionsFunc(dfa: DFA<LexAction[]>, n: number){
    let codegen = {
        addBlock(b: string, line: number){ 
    echoLine("");
    echo("                ");
    echo(b.replace(/\$token/g, 'this._token').replace(/\$\$/g, 'this._sematicVal') );
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
    echo("        ");
    echo(prefix );
    echo("tk !== -1 && this._prepareToken(");
    echo(prefix );
    echoLine("tk);");
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
    echo("    }");
    } 
    echoLine("");
    echoLine("");
    echoLine("export function tokenToString(tk: number){");
    echo("    return ");
    echo(prefix );
    echo("tokenAlias[tk] === null ? `<${");
    echo(prefix );
    echo("tokenNames[tk]}>` : `\"${");
    echo(prefix );
    echoLine("tokenAlias[tk]}\"`;");
    echoLine("}");
    echoLine("");
    echoLine("export class Token {");
    echoLine("    constructor(");
    echoLine("        public id: number,");
    echoLine("        public val: string,");
    echoLine("        public startLine: number,");
    echoLine("        public startColumn: number,");
    echoLine("        public endLine: number,");
    echoLine("        public endColumn: number");
    echoLine("    ){}");
    echoLine("    clone(){");
    echoLine("        return new Token(");
    echoLine("            this.id,");
    echoLine("            this.val,");
    echoLine("            this.startLine,");
    echoLine("            this.startColumn,");
    echoLine("            this.endLine,");
    echoLine("            this.endColumn");
    echoLine("        );");
    echoLine("    }");
    echoLine("    toString(){");
    echo("        return (");
    echo(prefix );
    echoLine("tokenAlias[this.id] === null ? ");
    echo("            `<${");
    echo(prefix );
    echoLine("tokenNames[this.id]}>` :");
    echo("            `\"${");
    echo(prefix );
    echoLine("tokenAlias[this.id]}\"`) + `(\"${this.val}\")`;");
    echoLine("    }");
    echo("}");
    let stype = input.sematicType || 'any'; 
    echoLine("");
    echo("export class ");
    echo(className );
    echoLine(" {");
    echoLine("    // members for lexer");
    echoLine("    private _lexState: number[];");
    echoLine("    private _state: number;");
    echoLine("    private _matched: string;");
    echoLine("    private _token: Token;");
    echoLine("    ");
    echoLine("    private _marker: { state: number, line: number, column: number } = { state: -1, line: 0, column: 0 };");
    echoLine("    private _backupCount: number;");
    echoLine("");
    echoLine("    private _line: number;");
    echoLine("    private _column: number;");
    echoLine("    private _tline: number;");
    echoLine("    private _tcolumn: number;");
    echoLine("");
    echoLine("    // members for parser");
    echoLine("    private _lrState: number[] = [];");
    echo("    private _sematicS: ");
    echo(stype );
    echoLine("[] = [];");
    echo("    private _sematicVal: ");
    echo(stype );
    echoLine(";");
    echoLine("");
    echoLine("    private _stop;");
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
    echoLine("        this._matched = '';");
    echoLine("        this._token = new Token(-1, null, 0, 0, 0, 0);");
    echoLine("        this._marker.state = -1;");
    echoLine("        this._backupCount = 0;");
    echoLine("        this._line = this._tline = 1;");
    echoLine("        this._column = this._tcolumn = 1;");
    echoLine("        ");
    echoLine("        this._lrState = [ 0 ];");
    echoLine("        this._sematicS = [];");
    echoLine("        this._sematicVal = null;");
    echoLine("");
    echoLine("        this._stop = false;");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  set ");
    echoLine("     */");
    echoLine("    private _setImg(s: string){");
    echoLine("        this._matched = s;");
    echoLine("        this._tline = this._line;");
    echoLine("        this._tcolumn = this._column;");
    echoLine("    }");
    echoLine("    private _prepareToken(tid: number){");
    echoLine("        this._token.id = tid;");
    echoLine("        this._token.val = this._matched;");
    echoLine("        this._token.startLine = this._tline;");
    echoLine("        this._token.startColumn = this._tcolumn;");
    echoLine("        this._token.endLine = this._line;");
    echoLine("        this._token.endColumn = this._column;");
    echoLine("");
    echoLine("        this._matched = '';");
    echoLine("        this._tline = this._line;");
    echoLine("        this._tcolumn = this._column;");
    echoLine("    }");
    echoLine("    private _returnToken(){");
    echo("        this._emit('token', ");
    echo(prefix );
    echoLine("tokenNames[this._token.id], this._token.val);");
    echoLine("        while(!this._stop && !this._acceptToken(this._token));");
    echoLine("        this._token.id = -1;");
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
    echoLine("        this._token.id !== -1 && this._returnToken();");
    echoLine("    }");
    echoLine("    private _rollback(){");
    echoLine("        let ret = this._matched.substr(this._matched.length - this._backupCount, this._backupCount);");
    echoLine("        this._matched = this._matched.substr(0, this._matched.length - this._backupCount);");
    echoLine("        this._backupCount = 0;");
    echoLine("        this._line = this._marker.line;");
    echoLine("        this._column = this._marker.column;");
    echoLine("        this._state = this._marker.state;");
    echoLine("        this._marker.state = -1;");
    echoLine("        return ret;");
    echoLine("    }");
    echoLine("    private _mark(){");
    echoLine("        this._marker.state = this._state;");
    echoLine("        this._marker.line = this._line;");
    echoLine("        this._marker.column = this._column;");
    echoLine("        this._backupCount = 0;");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  accept a character");
    echoLine("     *  @return - true if the character is consumed, false if not consumed");
    echoLine("     *  @api private");
    echoLine("     *  @internal");
    echoLine("     */");
    echoLine("    private _acceptChar(c: string){");
    echo("        function consume(cela: ");
    echo(className );
    echoLine(", c: string){");
    echoLine("            c === '\\n' ? (cela._line++, cela._column = 0) : (cela._column++);");
    echoLine("            cela._matched += c;");
    echoLine("            cela._marker.state !== -1 && (cela._backupCount++);");
    echoLine("            return true;");
    echoLine("        }");
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
    echoLine("                    this._marker.state = -1;");
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
    echoLine("                    this._mark();");
    echoLine("                    this._state = retn.state;");
    echoLine("                    return consume(this, c);");
    echoLine("                }");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                // current state doesn't lead to any state, just stay here.");
    echoLine("                this._doLexAction(lexstate, this._state);");
    echoLine("                // recover");
    echoLine("                this._marker.state = -1;");
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
    echoLine("                if(this._marker.state !== -1){");
    echoLine("                    // we have a previously marked state, which is a terminate state.");
    echoLine("                    let s = this._rollback();");
    echoLine("                    this._doLexAction(lexstate, this._state);");
    echoLine("                    this._state = 0;");
    echoLine("                    this.accept(s);");
    echoLine("                    // character not consumed");
    echoLine("                    return false;");
    echoLine("                }");
    echoLine("                else {");
    echoLine("                    // error occurs");
    echoLine("                    this._emit('lexicalerror', `unexpected character \"${c}\"`, this._line, this._column);");
    echoLine("                    // force consume");
    echoLine("                    return true;");
    echoLine("                }");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                this._state = retn.state;");
    echoLine("                // character consumed");
    echoLine("                return consume(this, c);");
    echoLine("            }");
    echoLine("        }");
    echoLine("    }");
    echoLine("    private _acceptEOF(){");
    echoLine("        if(this._state === 0){");
    echoLine("            // recover");
    echoLine("            this._prepareToken(0);");
    echoLine("            this._returnToken();");
    echoLine("            return true;");
    echoLine("        }");
    echoLine("        else {");
    echoLine("            let lexstate = this._lexState[this._lexState.length - 1];");
    echoLine("            let retn = { state: this._state, hasArc: false, isEnd: false };");
    echo("            ");
    echo(prefix );
    echoLine("lexers[lexstate](-1, retn);");
    echoLine("            if(retn.isEnd){");
    echoLine("                this._doLexAction(lexstate, this._state);");
    echoLine("                this._state = 0;");
    echoLine("                this._marker.state = -1;");
    echoLine("                return false;");
    echoLine("            }");
    echoLine("            else if(this._marker.state !== -1){");
    echoLine("                let s = this._rollback();");
    echoLine("                this._doLexAction(lexstate, this._state);");
    echoLine("                this._state = 0;");
    echoLine("                this.accept(s);");
    echoLine("                return false;");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                this._emit('lexicalerror', 'unexpected end of file');");
    echoLine("                return true;");
    echoLine("            }");
    echoLine("        }");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  input a string");
    echoLine("     *  @api public");
    echoLine("     */");
    echoLine("    accept(s: string){");
    echoLine("        for(let i = 0; i < s.length && !this._stop;){");
    echoLine("            this._acceptChar(s.charAt(i)) && i++;");
    echoLine("        }");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  tell the compiler that end of file is reached");
    echoLine("     *  @api public");
    echoLine("     */");
    echoLine("    end(){");
    echoLine("        while(!this._stop && !this._acceptEOF());");
    echoLine("        this._stop = true;");
    echoLine("    }");
    echoLine("    halt(){");
    echoLine("        this._stop = true;");
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
    echoLine("rulenum]] || null;");
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
    echo("        if(act === ");
    echo(prefix );
    echoLine("actERR){");
    echoLine("            // explicit error");
    echoLine("            this._syntaxError(t);");
    echoLine("            return true;");
    echoLine("        }");
    echoLine("        else if(act > 0){");
    echoLine("            // shift");
    echoLine("            if(t.id === 0){");
    echoLine("                // end of file");
    echoLine("                this._stop = true;");
    echoLine("                this._emit('accept');");
    echoLine("                return true;");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                this._lrState.push(act - 1);");
    echoLine("                this._sematicS.push(this._sematicVal);");
    echoLine("                this._sematicVal = null;");
    echoLine("                // token consumed");
    echoLine("                return true;");
    echoLine("            }");
    echoLine("        }");
    echoLine("        else if(act < 0){");
    echoLine("            this._doReduction(-act - 1);");
    echoLine("            return false;");
    echoLine("        }");
    echoLine("        else {");
    echoLine("            // error");
    echoLine("            this._syntaxError(t);");
    echoLine("            // force consume");
    echoLine("            return true;");
    echoLine("        }");
    echoLine("    }");
    echoLine("    private _syntaxError(t: Token){");
    echoLine("        let msg = `unexpected token ${t.toString()}, expecting one of the following token(s):\\n`");
    echoLine("        msg += this._expected(this._lrState[this._lrState.length - 1]);");
    echoLine("        this._emit(\"syntaxerror\", msg, t);");
    echoLine("    }");
    echoLine("    private _expected(state: number){");
    echo("        let dis = ");
    echo(prefix );
    echoLine("disact[state];");
    echoLine("        let ret = '';");
    echoLine("        function expect(tk: number){");
    echoLine("            let ind = dis + tk;");
    echo("            if(ind < 0 || ind >= ");
    echo(prefix );
    echo("pact.length || state !== ");
    echo(prefix );
    echoLine("checkact[ind]){");
    echo("                return ");
    echo(prefix );
    echoLine("defred[state] !== -1;");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                return true;");
    echoLine("            }");
    echoLine("        }");
    echo("        for(let tk = 0; tk < ");
    echo(prefix );
    echoLine("tokenCount; tk++){");
    echoLine("            expect(tk) && (ret += `    ${tokenToString(tk)} ...` + '\\n');");
    echoLine("        }");
    echoLine("        return ret;");
    echoLine("    }");
    echo("}");
    

}