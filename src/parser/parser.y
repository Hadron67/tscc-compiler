/*
    This file is the grammar for jscc.

    这是一个自我描述文件，啊，是吧。
*/
%header {
import { GBuilder, createFileBuilder, TokenRefType } from './gbuilder';
import { Assoc } from '../grammar/token-entry';
import { CompilationError as E, JsccError } from '../util/E';
import { Context } from '../util/context';
import { LexAction } from '../lexer/action';
import { Position, JNode, newNode, markPosition, nodeBetween } from './node';
import { File } from './file';

function nodeFromToken(t: Token): JNode{
    return {
        val: t.val,
        ext: null,
        startLine: t.startLine,
        startColumn: t.startColumn,
        endLine: t.endLine,
        endColumn: t.endColumn
    };
}
function nodeFromTrivalToken(t: Token): JNode{
    return {
        val: null,
        ext: null,
        startLine: t.startLine,
        startColumn: t.startColumn,
        endLine: t.endLine,
        endColumn: t.endColumn
    };
}
let escapes: {[s: string]: string} = {
    'n': '\n',
    'f': '\f',
    'b': '\b',
    'r': '\r',
    't': '\t',
    '\\': '\\',
    '"': '"',
    "'": "'"
};
function unescape(s: string): string{
    let ret = '';
    let i = 0;
    while(i < s.length){
        let c = s.charAt(i);
        if(c === '\\'){
            c = s.charAt(++i);
            if(escapes[c]){
                ret += escapes[c];
                i++;
            }
            else if(c === 'u' || c === 'x' || c === 'U' || c === 'X'){
                c = s.charAt(++i);
                let hex = '';
                while(/[0-9a-fA-F]/.test(c)){
                    hex += c;
                    c = s.charAt(++i);
                }
                ret += String.fromCharCode(parseInt(hex, 16));
            }
        }
        else {
            ret += c;
            i++;
        }
    }
    return ret;
}
}

%extra_arg{
    let gb: GBuilder;
    let ctx: Context;
    let assoc: Assoc;
    let lexact: LexAction;
    let ruleLhs: JNode;
    let least: boolean;
    let always: boolean;
}

%init {ctx1: Context, b: GBuilder}{
    gb = b;
    ctx = ctx1;
}

%token_hook (token){
    return (token.id === TokenKind.COMMENT || token.id === TokenKind.WHITESPACE);
}
// avoid multi-line tokens and empty tokens in order to support CodeMirror
%lex {

    LETTER = < ['a'-'z', 'A'-'Z', '$', '_'] | %import('es5UnicodeIDStart') >
    DIGIT = < ['a'-'z', 'A'-'Z', '0'-'9', '$', '_'] | %import('es5UnicodeIDPart') >
    ID = < <LETTER> (<LETTER>|<DIGIT>)* >

    HEX = < ['0'-'9', 'a'-'f', 'A'-'F'] >
    ESCAPE_CHAR = < "\\" (['n', 't', 'b', 'r', 'f', '"', "'", "\\"] | <UNICODE>) >
    UNICODE = < ['x', 'u', 'X', 'U'] <HEX>+ >
    
    < WHITESPACE: ["\n", "\t", " ", "\r"]+ >
    < COMMENT: "/*" >: [+IN_COMMENT]
    < COMMENT: ("//"|'#') [^"\n"]* >

    < NAME: <ID> >: { $$ = nodeFromToken($token); }
    < STRING: 
        '"' ( [^'"', '\n', '\\'] | <ESCAPE_CHAR> )* '"' 
    |   "'" ( [^"'", '\n', '\\'] | <ESCAPE_CHAR> )* "'"
    >: { $$ = nodeFromToken($token); $$.val = unescape($$.val.substr(1, $$.val.length - 2)); }
    < OPEN_BLOCK: "{" >: { $$ = nodeFromTrivalToken($token); }
    < CLOSE_BLOCK: "}" >: { $$ = nodeFromTrivalToken($token); }
    < OPT_DIR: "%option" >
    < LEX_DIR: "%lex" >
    < TOKEN_DIR: '%token' >
    < LEFT_DIR: "%left" >
    < RIGHT_DIR: "%right" >
    < NONASSOC_DIR: "%nonassoc" >
    < USE_DIR: "%use" >
    < HEADER_DIR: "%header" >
    < EXTRA_ARG_DIR: "%extra_arg" >
    < EMPTY: "%empty" >
    < TYPE_DIR: '%type' >
    < PREC_DIR: '%prec' >
    < INIT_DIR: '%init' >
    < OUTPUT_DIR: '%output' >
    < IMPORT_DIR: '%import' >
    < TOKEN_HOOK_DIR: '%token_hook' >
    < LEAST_DIR: '%least' >
    < ALWAYS_DIR: '%always' >
    < TOUCH_DIR: '%touch' >
    < GT: ">" >
    < LT: "<" >
    < BRA: "(" >
    < KET: ")" >
    < EQU: "=" >
    < CBRA: "[" >
    < CKET: "]" >
    < QUESTION: "?" >
    < STAR: "*" >
    < PLUS: "+" >
    < DASH: "-" >
    < COLON: ":" >
    < ARROW: "=>" >
    < EOL: ";" >
    < SEPERATOR: "%%" >
    < OR: "|" >
    < WEDGE: "^" >
    < COMMA: "," >
}

%touch <COMMENT> <WHITESPACE>

%lex <IN_COMMENT> {
    < COMMENT: ( [^'*']|'*'[^'/'] )+ >
    < COMMENT: '*/' >: [-]
}

%lex <IN_BLOCK> {
    < ANY_CODE: ( [^"{", "}", "\\"] | "\\" [^"{", "}"] )+ >: { $$ = newNode($token.val); }
    < ANY_CODE: "\\" ["{", "}"] >: { $$ = newNode($token.val.charAt(1)); }
    < OPEN_BLOCK: "{" >: { $$ = nodeFromTrivalToken($token); }
    < CLOSE_BLOCK: "}" >: { $$ = nodeFromTrivalToken($token); }
}

%lex <IN_ACTION_BLOCK> {
    < ANY_CODE: 
        ( [^"{", "}", "\\", "$"] | "\\" [^"{", "}", "$"] )+ 
    |   "$" ( [^"{", "}", "\\", "$"] | "\\" [^"{", "}", "$"] )*
    >: { $$ = nodeFromToken($token); }
    < ANY_CODE: "\\" ["{", "}", "$"] >: { $$ = nodeFromToken($token); $$.val = $$.val.charAt(1); }
    < OPEN_BLOCK: "{" >: { $$ = nodeFromTrivalToken($token); }
    < CLOSE_BLOCK: "}" >: { $$ = nodeFromTrivalToken($token); }

    < LHS_REF: %least "$$" >
    < TOKEN_REF: %least "$token" >
    < MATCHED: %least "$matched" >
    < EMIT_TOKEN: %least "$emit<" <ID> ">" >
    : { $$ = nodeFromToken($token); $$.val = $$.val.substr(6, $$.val.length - 7); }
}

%lex <IN_EPILOGUE> {
    < ANY_CODE: [^]+ >: { $$ = nodeFromToken($token); }
}

%type {JNode}

%%

start: options '%%' body '%%' [+IN_EPILOGUE] epilogue;
options: options option | /* empty */;
option:
    '%lex' { gb.lexBuilder.prepareLex(); } states_ '{' lexBody '}'
|   associativeDir assocTokens { gb.incPr(); }
|   '%option' '{' optionBody '}'
|   '%header' b = block { gb.setHeader(b); }
|   '%extra_arg' b = block { gb.setExtraArg(b); }
|   '%type' ty = block { gb.setType(ty); }
|   '%init' args = block b = block { gb.setInit(args, b); }
|   '%output' op = <STRING> { gb.setOutput(op); }
|   '%token' tokenDefs
|   '%token_hook' '(' arg = <NAME> ')' b = block { gb.setTokenHook(arg, b); }
|   '%touch' touchTokenList
;
tokenDefs: 
    tokenDefs '<' t = <NAME> '>' { gb.defToken(t, null); }
|   '<' t = <NAME> '>' { gb.defToken(t, null); }
;
touchTokenList:
    touchTokenList t = tokenRef { gb.touchToken(t, t.ext); }
|   t = tokenRef { gb.touchToken(t, t.ext); }
;
epilogue:
    /* empty */
|   ep = nonEmptyEpilogue { gb.setEpilogue(ep); }
;
nonEmptyEpilogue:
    nonEmptyEpilogue c = <ANY_CODE> { $$ = nodeBetween($$, c, $$.val + c.val); }
|   <ANY_CODE>
;
associativeDir:
    '%left' { assoc = Assoc.LEFT; }
|   '%right' { assoc = Assoc.RIGHT; }
|   '%nonassoc' { assoc = Assoc.NON; }
;
assocTokens: 
    assocTokens assocToken 
|   assocToken
;
assocToken:
    t = tokenRef { gb.defineTokenPrec(t, assoc, t.ext); }
|   t = <NAME> { gb.defineTokenPrec(t, assoc, TokenRefType.NAME); }
;

optionBody: 
    optionBody name = <NAME> '=' val = <STRING> { gb.setOpt(name, val); }
|   /* empty */ ;

states_: '<' states '>' | { gb.lexBuilder.selectState('DEFAULT'); };
states: 
    s = <NAME> { gb.lexBuilder.selectState(s.val); }
|   states ',' s = <NAME> { gb.lexBuilder.selectState(s.val); }
;

lexBody: lexBody lexBodyItem | ;
lexBodyItem: 
    v = <NAME> { gb.lexBuilder.prepareVar(v); } 
    '=' '<' regexp '>' { gb.lexBuilder.endVar(); }
|   newState '<' regexp '>' lexAction_ { gb.lexBuilder.end(lexact, least, '(untitled)'); }
|   newState '<' tn = <NAME> ':' regexp '>' lexAction_ { 
        let tdef = gb.defToken(tn, gb.lexBuilder.getPossibleAlias());
        lexact.returnToken(tdef);
        gb.lexBuilder.end(lexact, least, tn.val);
    }
;

newState: { gb.lexBuilder.newState(); };
lexAction_: ':' lexAction | { lexact = new LexAction(); };
lexAction: 
    { lexact = new LexAction(); } '[' lexActions ']'
|   { lexact = new LexAction(); } actionBlock 
;

lexActions: 
    lexActions ',' lexActionItem 
|   lexActionItem
;
lexActionItem: 
    '+' vn = <NAME> { gb.addPushStateAction(lexact, vn); lexact.raw('; '); }
|   '-' { lexact.popState(); lexact.raw('; '); }
|   '=>' sn = <NAME> { gb.addSwitchToStateAction(lexact, sn); lexact.raw('; '); }
|   '=' s = <STRING> { lexact.setImg(s.val); lexact.raw('; '); }
|   actionBlock
;
regexp: 
    innerRegexp { least = false; }
|   '%least' innerRegexp { least = true; }
;
innerRegexp: { gb.lexBuilder.enterUnion(); } union { gb.lexBuilder.leaveUnion(); };
union:
    union '|' simpleRE { gb.lexBuilder.endUnionItem(); }
|   simpleRE { gb.lexBuilder.endUnionItem(); }
;
simpleRE: simpleRE basicRE | basicRE;
basicRE: 
    { gb.lexBuilder.enterSimple(); } primitiveRE 
    suffix = rePostfix { gb.lexBuilder.simplePostfix(suffix.val as (''|'?'|'+'|'*')); }
;
rePostfix: 
    '+' { $$ = newNode('+'); }
|   '?' { $$ = newNode('?'); }
|   '*' { $$ = newNode('*'); }
|   { $$ = newNode(''); }
;
primitiveRE: 
    '(' innerRegexp ')'
|   '[' inverse_ setRE_ ']'
|   '<' n = <NAME> '>' { gb.lexBuilder.addVar(n); }
|   '%import' '(' i = <STRING> ')' { gb.lexBuilder.importVar(i); }
|   s = <STRING> { gb.lexBuilder.addString(s.val); }
;
inverse_: '^' { gb.lexBuilder.beginSet(true); } | { gb.lexBuilder.beginSet(false); };
setRE_: setRE |;
setRE: setRE ',' setREItem | setREItem;
setREItem: 
    s = <STRING> { gb.lexBuilder.addSetItem(s, s); }
|   from = <STRING> '-' to = <STRING> 
    { gb.lexBuilder.addSetItem(from, to); }
;

body: body bodyItem | bodyItem;
bodyItem: 
    compoundRule
;
compoundRule: n = <NAME> { ruleLhs = n; } arrow rules ';';
arrow: ':' | '=>';
rules: rules '|' rule | rule;
rule: 
    { gb.prepareRule(ruleLhs); } 
    ruleHead ruleBody ruleTrailer { gb.commitRule(); } 
;
ruleHead: '%use' '(' varUseList ')' | ;
varUseList: 
    varUseList ',' vn = <NAME> { gb.addRuleUseVar(vn); }
|   vn = <NAME> { gb.addRuleUseVar(vn); }
;
ruleBody: ruleItems | '%empty';
ruleItems: ruleItems ruleItem | /* empty */;
itemName: 
    itn = <NAME> '=' { gb.addRuleSematicVar(itn); } 
|   /* empty */
;
ruleItem: 
    t = <NAME> { gb.addRuleItem(t, TokenRefType.NAME); }
|   vn = <NAME> '=' { gb.addRuleSematicVar(vn); } 
    t = <NAME> { gb.addRuleItem(t, TokenRefType.NAME); }
|   itemName t = tokenRef { gb.addRuleItem(t, t.ext); }
|   itemName lexAction { gb.addAction(lexact); }
;
tokenRef: 
    '<' t = <NAME> '>' { $$ = t; $$.ext = TokenRefType.TOKEN; } 
|   <STRING> { $$.ext = TokenRefType.STRING; }
;
ruleTrailer:
    /* empty */
|   rulePrec
|   rulePrec lexAction { gb.addAction(lexact); }
;
rulePrec:
    '%prec' t = <NAME> { gb.defineRulePr(t, TokenRefType.NAME); }
|   '%prec' t = tokenRef { gb.defineRulePr(t, t.ext); }
;

block: open = "{" [+IN_BLOCK] bl = innerBlock close = "}" [-]
    { $$ = nodeBetween(open, close, bl.val); }
;
innerBlock: innerBlock b = innerBlockItem { $$.val += b.val; } | { $$ = newNode(''); };
innerBlockItem:
    <ANY_CODE> 
|   '{' [+IN_BLOCK] b = innerBlock '}' [-] 
    { $$ = newNode(''); $$.val = '{' + b.val + '}'; }
;

actionBlock:
    always open = "{" [+IN_ACTION_BLOCK] t = { lexact.beginBlock(open, always); }
    innerActionBlock close = "}" [-] { lexact.endBlock(close); }
;
always: '%always' { always = true; } | /* empty */ { always = false; };
innerActionBlock: innerActionBlock innerActionBlockItem |;
innerActionBlockItem:
    c = <ANY_CODE> { lexact.raw(c.val); }
|   <LHS_REF> { lexact.lhs(); }
|   <TOKEN_REF> { lexact.tokenObj(); }
|   <MATCHED> { lexact.matched(); }
|   t = <EMIT_TOKEN> { gb.addEmitTokenAction(lexact, t); }
|   '{' [+IN_ACTION_BLOCK] { lexact.raw('\{'); } innerActionBlock '}' [-] { lexact.raw('\}'); }
;
%%

export namespace highlight {
    export enum TokenType {
        EOF = 1,
        NONE,
        ERROR,
        STRING,
        NAME,
        COMMENT,
        DIRECTIVE,
        PUNCTUATION,
        CODE,
        TOKEN_IN_CODE
    };
    function getTokenType(tid: TokenKind): TokenType{
        switch(tid){
            case TokenKind.EOF: return TokenType.EOF;
            case TokenKind.ERROR: return TokenType.ERROR;
            case TokenKind.COMMENT: return TokenType.COMMENT;
            case TokenKind.NAME: return TokenType.NAME;
            case TokenKind.STRING: return TokenType.STRING;
            case TokenKind.OPT_DIR:
            case TokenKind.LEX_DIR:
            case TokenKind.TOKEN_DIR:
            case TokenKind.LEFT_DIR:
            case TokenKind.RIGHT_DIR:
            case TokenKind.NONASSOC_DIR:
            case TokenKind.USE_DIR:
            case TokenKind.HEADER_DIR:
            case TokenKind.EXTRA_ARG_DIR:
            case TokenKind.EMPTY:
            case TokenKind.TYPE_DIR:
            case TokenKind.PREC_DIR:
            case TokenKind.INIT_DIR:
            case TokenKind.OUTPUT_DIR:
            case TokenKind.IMPORT_DIR:
            case TokenKind.TOKEN_HOOK_DIR:
            case TokenKind.LEAST_DIR:
            case TokenKind.ALWAYS_DIR:
            case TokenKind.SEPERATOR:
            case TokenKind.TOUCH_DIR: return TokenType.DIRECTIVE;
            case TokenKind.OPEN_BLOCK:
            case TokenKind.CLOSE_BLOCK:
            case TokenKind.GT:
            case TokenKind.LT:
            case TokenKind.BRA:
            case TokenKind.KET:
            case TokenKind.EQU:
            case TokenKind.CBRA:
            case TokenKind.CKET:
            case TokenKind.QUESTION:
            case TokenKind.STAR:
            case TokenKind.PLUS:
            case TokenKind.DASH:
            case TokenKind.COLON:
            case TokenKind.ARROW:
            case TokenKind.EOL:
            case TokenKind.OR:
            case TokenKind.WEDGE:
            case TokenKind.COMMA: return TokenType.PUNCTUATION;
            case TokenKind.LHS_REF:
            case TokenKind.TOKEN_REF:
            case TokenKind.MATCHED:
            case TokenKind.EMIT_TOKEN: return TokenType.TOKEN_IN_CODE;
            case TokenKind.WHITESPACE:
            case TokenKind.ANY_CODE:
            default: return TokenType.NONE;
        }
    }
    export interface HighlightContext {
        load(input: ParserInput | string);
        nextToken(): TokenType;
        loadState(state: ParserState);
        getState(): ParserState;
    };
    export function createHighlightContext(){
        var parser: Parser = createParser();
        var err = false;
        parser.disableBlocks();
        parser.on('syntaxerror', () => err = true);
        parser.init(null, null);
        return {
            load: input => parser.load(input),
            nextToken,
            loadState: s => parser.loadParserState(s),
            getState: () => parser.getParserState()
        };
        function nextToken(): TokenType{
            err = false;
            var t = parser.nextToken();
            if(t === null){
                return null;
            }
            else if(t.id !== TokenKind.EOF && err){
                return TokenType.ERROR;
            }
            else {
                return getTokenType(t.id);
            }
        }
    }
    export function highlightString(s: string, getClass: (t: TokenType) => string): string{
        var escapes = {
            '>': '&gt;',
            '<': '&lt;',
            ' ': '&nbsp;',
            '&': '&amp;',
            '\n': '<br />',
            '\t': '&nbsp;&nbsp;&nbsp;&nbsp;'
        };
        function escapeHTML(s: string): string{
            var ret = '';
            for(var i = 0; i < s.length; i++){
                var c = s.charAt(i);
                ret += escapes[c] || c;
            }
            return ret;
        }
        var ret = '';
        var tokenBase: number = 0;
        var hc = createHighlightContext();
        var i = 0;
        hc.load({
            current: () => i < s.length ? s.charCodeAt(i) : null,
            next: () => i++,
            isEof: () => i >= s.length,
            backup: s => i -= s.length
        });
        var tt: TokenType;
        while((tt = hc.nextToken()) !== TokenType.EOF){
            var cl = getClass(tt);
            if(cl !== null){
                ret += `<span class="${cl}">${escapeHTML(s.substr(tokenBase, i - tokenBase))}</span>`;
            }
            else {
                ret += escapeHTML(s.substr(tokenBase, i - tokenBase));
            }
            tokenBase = i;
        }
        return ret;
    }
};
function charPosition(c: string, line: number, column: number): Position{
    return {
        startLine: line,
        startColumn: column,
        endLine: line,
        endColumn: c.charCodeAt(0) > 0xff ? column + 1 : column
    }
}
export function yyparse(ctx: Context, source: string): File{
    let parser = createParser();
    let err = false;
    parser.on('syntaxerror', (token, state) => {
        if(token.id === TokenKind.ERROR){
            ctx.requireLines((ctx, lines) => {
                let msg2 = 'unexpected illegal token ' + markPosition(token, lines) + '\n';
                ctx.err(new JsccError(msg2, 'Lexical error'));
            });
        }
        else {
            var msg = `unexpected token ${token.toString()}, expecting one of the following tokens:\n`;
            for(var tk of getExpectedTokens(state)){
                msg += `    ${tokenToString(tk)} ...\n`;
            }
            ctx.requireLines((ctx, lines) => {
                let msg2 = markPosition(token, lines) + '\n' + msg;
                ctx.err(new JsccError(msg2, 'Syntax error'));
            });
        }
        parser.halt();
        err = true;
    });
    let gb = createFileBuilder(ctx);
    parser.init(ctx, gb);

    ctx.beginTime('parse grammar file');
    parser.accept(source);
    parser.end();
    ctx.endTime();

    var eol = parser.getLineTerminator();
    var el = '\n';
    if(eol !== LineTerm.NONE && eol !== LineTerm.AUTO){
        el = eol === LineTerm.CR ? '\r' : 
            eol === LineTerm.LF ? '\n' :
            eol === LineTerm.CRLF ? '\r\n' : null;
        gb.setLineTerminator(el);
    }
    
    if(err){
        var ret = new File();
        ret.eol = el;
        return ret;
    }
    else {
        return gb.build();
    }
}