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
import { LexAction, returnToken, blockAction, pushState, popState, setImg } from '../lexer/action';
import { Position, JNode, newNode, markPosition } from './node';
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

function unescape(s: string){
    return s
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\\\/g, '\\');
}
}

%extra_arg{
    let gb: GBuilder;
    let ctx: Context;
    let assoc: Assoc;
    let lexacts: LexAction[];
    let ruleLhs: JNode;
}

%init {ctx1: Context, b: GBuilder}{
    gb = b;
    ctx = ctx1;
}

%lex {
    LETTER = < ['a'-'z', 'A'-'Z', '$', '_'] >
    DIGIT = < ['0'-'9'] >
    HEX = < ['0'-'9', 'a'-'f', 'A'-'F'] >
    ESCAPE_CHAR = < "\\" (['n', 't', 'b', 'r', 'f', '"', "'", "\\"] | <UNICODE>) >
    UNICODE = < ['x', 'u'] <HEX>+ >
    
    < ["\n", "\t", " ", "\r"]+ >: [='']
    < "/*" ([^"*", "/"]|[^"*"]"/"|"*"[^"/"])* "*/" >: [='']
    < "//" [^"\n"]* >: [='']

    < NAME: <LETTER> (<LETTER>|<DIGIT>)* >: { $$ = nodeFromToken($token); }
    < STRING: 
        '"' ( [^'"', '\n', '\\'] | <ESCAPE_CHAR> )* '"' 
    |   "'" ( [^"'", '\n', '\\'] | <ESCAPE_CHAR> )* "'"
    >: { $$ = nodeFromToken($token);$$.val = unescape($$.val.substr(1, $$.val.length - 2)); }
    < OPEN_BLOCK: "{" >: { $$ = nodeFromTrivalToken($token); }
    < CLOSE_BLOCK: "}" >: { $$ = nodeFromTrivalToken($token); }
    < OPT_DIR: "%option" >
    < LEX_DIR: "%lex" >
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
    < ANY_CODE: [^"{", "}"]* >: { $$ = newNode($token.val); }
    < OPEN_BLOCK: "{" >: { $$ = nodeFromTrivalToken($token); }
    < CLOSE_BLOCK: "}" >: { $$ = nodeFromTrivalToken($token); }
}
%lex <IN_EPILOGUE> {
    < ANY_EPLOGUE_CODE: [^]+ >: { $$ = nodeFromToken($token); }
}

%type {JNode}

%%

start: options '%%' body [+IN_EPILOGUE] '%%' epilogue;
options: options option | ;
option:
    '%lex' { gb.lexBuilder.prepareLex(); } states_ '{' lexBody '}'
|   associativeDir assocTokens
|   '%option' '{' optionBody '}'
|   '%header' b = block { gb.setHeader(b); }
|   '%extra_arg' b = block { gb.setExtraArg(b); }
|   '%type' t = block { gb.setType(t); }
|   '%init' args = block b = block { gb.setInit(args, b); }
|   '%output' op = <STRING> { gb.setOutput(op); }
;
epilogue:
    /* empty */
|   ep = <ANY_EPLOGUE_CODE> { gb.setEpilogue(ep); }
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
    v = <NAME> { gb.lexBuilder.prepareVar(v.val, v.startLine); } 
    '=' '<' regexp '>' { gb.lexBuilder.endVar(); }
|   newState '<' regexp '>' lexAction_ { gb.lexBuilder.end(lexacts, '(untitled)'); }
|   newState '<' tn = <NAME> ':' regexp '>' lexAction_ { 
    let tdef = gb.defToken(tn, gb.lexBuilder.getPossibleAlias());
    lexacts.push(returnToken(tdef));
    gb.lexBuilder.end(lexacts, tn.val);
}
;
newState: { gb.lexBuilder.newState(); };
lexAction_: ':' lexAction | { lexacts = []; };
lexAction: 
    { lexacts = []; } '[' lexActions ']'
|   b = block { lexacts = [blockAction(b.val, b.startLine)]; }
;

lexActions: 
    lexActions ',' lexActionItem 
|   lexActionItem
;
lexActionItem: 
    '+' vn = <NAME> { gb.addPushStateAction(lexacts, vn); }
|   '-' { lexacts.push(popState()); }
|   b = block { lexacts.push(blockAction(b.val, b.startLine)); }
|   '=' s = <STRING> { lexacts.push(setImg(s.val)); }
;

regexp: { gb.lexBuilder.enterUnion(); } union { gb.lexBuilder.leaveUnion(); };
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
    '(' regexp ')'
|   '[' inverse_ setRE_ ']'
|   '<' n = <NAME> '>' { gb.lexBuilder.addVar(n.val, n.startLine); }
|   s = <STRING> { gb.lexBuilder.addString(s.val); }
;
inverse_: '^' { gb.lexBuilder.beginSet(true); } | { gb.lexBuilder.beginSet(false); };
setRE_: setRE |;
setRE: setRE ',' setREItem | setREItem;
setREItem: 
    s = <STRING> { gb.lexBuilder.addSetItem(s.val, s.val, s.startLine, s.startLine); }
|   from = <STRING> '-' to = <STRING> 
    { gb.lexBuilder.addSetItem(from.val, to.val, from.startLine, to.startLine); }
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
    ruleHead ruleBody ruleTrailer     { gb.commitRule(); } 
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
|   itemName lexAction { gb.addAction(lexacts); }
;
tokenRef: 
    '<' t = <NAME> '>' { $$ = t; $$.ext = TokenRefType.TOKEN; } 
|   <STRING> { $$.ext = TokenRefType.STRING; }
;
ruleTrailer:
    /* empty */
|   rulePrec
|   rulePrec lexAction { gb.addAction(lexacts); }
;
rulePrec:
    '%prec' t = <NAME> { gb.defineRulePr(t, TokenRefType.NAME); }
|   '%prec' t = tokenRef { gb.defineRulePr(t, t.ext); }
;

block: [+IN_BLOCK] open = "{" bl = innerBlock [-] close = "}" { 
    $$ = newNode('');
    $$.val = bl.val;
    $$.startLine = open.startLine;
    $$.startColumn = open.startColumn;
    $$.endLine = close.endLine;
    $$.endColumn = close.endColumn;
}
;
innerBlock: innerBlock b = innerBlockItem { $$.val += b.val; } | { $$ = newNode(''); };
innerBlockItem: 
    <ANY_CODE> 
|   [+IN_BLOCK] '{' b = innerBlock [-] '}' 
    { $$ = newNode(''); $$.val = '{' + b.val + '}'; }
;

%%
function charPosition(line: number, column: number): Position{
    return {
        startLine: line,
        startColumn: column,
        endLine: line,
        endColumn: column
    }
}
export function parse(ctx: Context, source: string): File{
    let parser = createParser();
    let err = false;
    parser.on('lexicalerror', (msg, line, column) => {
        ctx.requireLines((ctx, lines) => {
            let msg2 = msg + ' ' + markPosition(charPosition(line, column), lines);
            ctx.err(new JsccError(msg2, 'LexicalError'));
        });
        // ctx.err(new CompilationError(msg, line));
        parser.halt();
        err = true;
    });
    parser.on('syntaxerror', (msg, token) => {
        // ctx.err(new CompilationError(msg, token.startLine));
        ctx.requireLines((ctx, lines) => {
            let msg2 = markPosition(token, lines) + endl + msg;
            ctx.err(new JsccError(msg2, 'SyntaxError'));
        });
        parser.halt();
        err = true;
    });
    let gb = createFileBuilder(ctx);
    parser.init(ctx, gb);
    parser.accept(source);
    parser.end();
    if(err){
        return null;
    }
    else {
        return gb.build();
    }
}