/*
    This file is the grammar for jscc.

    这是一个自我描述文件，啊，是吧。
*/
%header {
import { GBuilder, createFileBuilder, TokenRefType } from './gbuilder';
import { Assoc } from '../grammar/token-entry';
import { CompilationError as E, JsccError } from '../util/E';
import { InputStream, endl } from '../util/io';
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
}

%init {ctx1: Context, b: GBuilder}{
    gb = b;
    ctx = ctx1;
}

%lex {

    LETTER = < ['a'-'z', 'A'-'Z', '$', '_'] | %import('es5UnicodeIDStart') >
    DIGIT = < ['a'-'z', 'A'-'Z', '0'-'9', '$', '_'] | %import('es5UnicodeIDPart') >
    ID = < <LETTER> (<LETTER>|<DIGIT>)* >

    HEX = < ['0'-'9', 'a'-'f', 'A'-'F'] >
    ESCAPE_CHAR = < "\\" (['n', 't', 'b', 'r', 'f', '"', "'", "\\"] | <UNICODE>) >
    UNICODE = < ['x', 'u', 'X', 'U'] <HEX>+ >
    
    < ["\n", "\t", " ", "\r"]+ >: [='']
    < "/*" ([^"*", "/"]|[^"*"]"/"|"*"[^"/"])* "*/" >: [='']
    < ("//"|'#') [^"\n"]* >: [='']

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
    < LEAST_DIR: '%least' >
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

%lex <IN_BLOCK> {
    < ANY_CODE: ( [^"{", "}", "\\"] | "\\" [^"{", "}"] )+ >: { $$ = newNode($token.val); }
    < ESCAPED_CHAR_IN_BLOCK: "\\" ["{", "}"] >: { $$ = newNode($token.val.charAt(1)); }
    < OPEN_BLOCK: "{" >: { $$ = nodeFromTrivalToken($token); }
    < CLOSE_BLOCK: "}" >: { $$ = nodeFromTrivalToken($token); }
}

%lex <IN_ACTION_BLOCK> {
    < ANY_CODE: 
        ( [^"{", "}", "\\", "$"] | "\\" [^"{", "}", "$"] )+ 
    |   "$" ( [^"{", "}", "\\", "$"] | "\\" [^"{", "}", "$"] )*
    >: { $$ = nodeFromToken($token); }
    < ESCAPED_CHAR_IN_BLOCK: "\\" ["{", "}", "$"] >: { $$ = nodeFromToken($token); $$.val = $$.val.charAt(1); }
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
;
tokenDefs: 
    tokenDefs '<' t = <NAME> '>' { gb.defToken(t, null); }
|   '<' t = <NAME> '>' { gb.defToken(t, null); }
;
epilogue:
    /* empty */
|   ep = <ANY_CODE> { gb.setEpilogue(ep); }
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
ruleItem0: 
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
|   <ESCAPED_CHAR_IN_BLOCK>
|   '{' [+IN_BLOCK] b = innerBlock '}' [-] 
    { $$ = newNode(''); $$.val = '{' + b.val + '}'; }
;

actionBlock: 
    open = "{" [+IN_ACTION_BLOCK] t = { lexact.beginBlock(open); }
    innerActionBlock close = "}" [-] { lexact.endBlock(close); }
;
innerActionBlock: innerActionBlock innerActionBlockItem |;
innerActionBlockItem:
    c = <ANY_CODE> { lexact.raw(c.val); }
|   c = <ESCAPED_CHAR_IN_BLOCK> { lexact.raw(c.val); }
|   <LHS_REF> { lexact.lhs(); }
|   <TOKEN_REF> { lexact.tokenObj(); }
|   <MATCHED> { lexact.matched(); }
|   t = <EMIT_TOKEN> { gb.addEmitTokenAction(lexact, t); }
|   '{' [+IN_ACTION_BLOCK] { lexact.raw('\{'); } innerActionBlock '}' [-] { lexact.raw('\}'); }
;
%%
function charPosition(c: string, line: number, column: number): Position{
    return {
        startLine: line,
        startColumn: column,
        endLine: line,
        endColumn: c.charCodeAt(0) > 0xff ? column + 1 : column
    }
}
export function parse(ctx: Context, source: string): File{
    let parser = createParser();
    let err = false;
    parser.on('lexicalerror', (c, line, column) => {
        ctx.requireLines((ctx, lines) => {
            let msg2 = `unexpected character ${c}`;
            msg2 += ' ' + markPosition(charPosition(c, line, column), lines);
            ctx.err(new JsccError(msg2, 'Lexical error'));
        });
        // ctx.err(new CompilationError(msg, line));
        parser.halt();
        err = true;
    });
    parser.on('syntaxerror', (msg, token) => {
        // ctx.err(new CompilationError(msg, token.startLine));
        ctx.requireLines((ctx, lines) => {
            let msg2 = markPosition(token, lines) + endl + msg;
            ctx.err(new JsccError(msg2, 'Syntax error'));
        });
        parser.halt();
        err = true;
    });
    let gb = createFileBuilder(ctx);
    parser.init(ctx, gb);

    ctx.beginTime('parse grammar file');
    parser.accept(source);
    parser.end();
    ctx.endTime();

    if(err){
        return null;
    }
    else {
        return gb.build();
    }
}