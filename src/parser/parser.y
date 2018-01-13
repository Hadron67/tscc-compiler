/*
    This file is the grammar for jscc.

    这是一个自我描述文件！hahaha!
*/
%header {
import { GBuilder, TokenRefType } from './gbuilder';
import { Assoc } from '../grammar/token-entry';
import { CompilationError as E, CompilationError } from '../util/E';
import { InputStream } from '../util/io';
import { Context } from '../util/context';
import { LexAction, returnToken, blockAction, pushState, popState, setImg } from '../lexer/action';

interface Position{
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}
interface Node{
    val: string;
    ext: any;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}
function nodeFromToken(t: Token): Node{
    return {
        val: t.val,
        ext: null,
        startLine: t.startLine,
        startColumn: t.startColumn,
        endLine: t.endLine,
        endColumn: t.endColumn
    };
}
function nodeFromTrivalToken(t: Token): Node{
    return {
        val: null,
        ext: null,
        startLine: t.startLine,
        startColumn: t.startColumn,
        endLine: t.endLine,
        endColumn: t.endColumn
    };
}
function newNode(val: string): Node{
    return {
        val: val,
        ext: null,
        startLine: 0,
        startColumn: 0,
        endLine: 0,
        endColumn: 0
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
    gb: GBuilder;
    ctx: Context;
    assoc: Assoc;
    lexacts: LexAction[];
    ruleLhs: Node;
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

%type Node

%%

start: options '%%' body '%%';
options: options option | ;
option:
    '%lex' { this.gb.lexBuilder.prepareLex(); } states_ '{' lexBody '}'
|   associativeDir assocTokens
|   '%option' '{' optionBody '}'
|   '%header' b = block { this.gb.setHeader(b.val); }
|   '%extra_arg' b = block { this.gb.setExtraArg(b.val); }
|   '%type' t = <NAME> { this.gb.setType(t.val); }
;
associativeDir:
    '%left' { this.assoc = Assoc.LEFT; }
|   '%right' { this.assoc = Assoc.RIGHT; }
|   '%nonassoc' { this.assoc = Assoc.NON; }
;
assocTokens: 
    assocTokens assocToken 
|   assocToken
;
assocToken:
    t = tokenRef { this.gb.defineTokenPrec(t.val, this.assoc, t.ext, t.startLine); }
|   t = <NAME> { this.gb.defineTokenPrec(t.val, this.assoc, TokenRefType.NAME, t.startLine); }
;

optionBody: 
    optionBody name = <NAME> '=' val = <STRING> { this.gb.setOpt(name.val, val.val); }
|   /* empty */ ;

states_: '<' states '>' | { this.gb.lexBuilder.selectState('DEFAULT'); };
states: 
    s = <NAME> { this.gb.lexBuilder.selectState(s.val); }
|   states ',' s = <NAME> { this.gb.lexBuilder.selectState(s.val); }
;

lexBody: lexBody lexBodyItem | ;
lexBodyItem: 
    v = <NAME> { this.gb.lexBuilder.prepareVar(v.val, v.startLine); } 
    '=' '<' regexp '>' { this.gb.lexBuilder.endVar(); }
|   newState '<' regexp '>' lexAction_ { this.gb.lexBuilder.end(this.lexacts, '(untitled)'); }
|   newState '<' tn = <NAME> ':' regexp '>' lexAction_ { 
    let tdef = this.gb.defToken(tn.val, this.gb.lexBuilder.possibleAlias, tn.startLine);
    this.lexacts.push(returnToken(tdef));
    this.gb.lexBuilder.end(this.lexacts, tn.val);
}
;
newState: { this.gb.lexBuilder.newState(); };
lexAction_: ':' lexAction | { this.lexacts = []; };
lexAction: 
    { this.lexacts = []; } '[' lexActions ']'
|   b = block { this.lexacts = [blockAction(b.val, b.startLine)]; }
;

lexActions: 
    lexActions ',' lexActionItem 
|   lexActionItem
;
lexActionItem: 
    '+' vn = <NAME> { this.gb.addPushStateAction(this.lexacts, vn.val, vn.startLine); }
|   '-' { this.lexacts.push(popState()); }
|   b = block { this.lexacts.push(blockAction(b.val, b.startLine)); }
|   '=' s = <STRING> { this.lexacts.push(setImg(s.val)); }
;

regexp: { this.gb.lexBuilder.enterUnion(); } union { this.gb.lexBuilder.leaveUnion(); };
union:
    union '|' simpleRE { this.gb.lexBuilder.endUnionItem(); }
|   simpleRE { this.gb.lexBuilder.endUnionItem(); }
;
simpleRE: simpleRE basicRE | basicRE;
basicRE: 
    { this.gb.lexBuilder.enterSimple(); } primitiveRE 
    suffix = rePostfix { this.gb.lexBuilder.simplePostfix(suffix.val as (''|'?'|'+'|'*')); }
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
|   '<' n = <NAME> '>' { this.gb.lexBuilder.addVar(n.val, n.startLine); }
|   s = <STRING> { this.gb.lexBuilder.addString(s.val); }
;
inverse_: '^' { this.gb.lexBuilder.beginSet(true); } | { this.gb.lexBuilder.beginSet(false); };
setRE_: setRE |;
setRE: setRE ',' setREItem | setREItem;
setREItem: 
    s = <STRING> { this.gb.lexBuilder.addSetItem(s.val, s.val, s.startLine, s.startLine); }
|   from = <STRING> '-' to = <STRING> 
    { this.gb.lexBuilder.addSetItem(from.val, to.val, from.startLine, to.startLine); }
;

body: body bodyItem | bodyItem;
bodyItem: 
    compoundRule
;
compoundRule: n = <NAME> { this.ruleLhs = n; } arrow rules ';';
arrow: ':' | '=>';
rules: rules '|' rule | rule;
rule: 
    { this.gb.prepareRule(this.ruleLhs.val,this.ruleLhs.startLine); } 
    ruleHead ruleBody ruleTrailer { this.gb.commitRule(); } 
;
ruleHead: '%use' '(' varUseList ')' | ;
varUseList: 
    varUseList ',' vn = <NAME> { this.gb.addRuleUseVar(vn.val, vn.startLine); }
|   vn = <NAME> { this.gb.addRuleUseVar(vn.val, vn.startLine); }
;
ruleBody: ruleItems | '%empty';
ruleItems: ruleItems ruleItem | /* empty */;
itemName: 
    itn = <NAME> '=' { this.gb.addRuleSematicVar(itn.val, itn.startLine); } 
|   /* empty */
;
ruleItem: 
    t = <NAME> { this.gb.addRuleItem(t.val,TokenRefType.NAME,t.startLine); }
|   vn = <NAME> '=' { this.gb.addRuleSematicVar(vn.val, vn.startLine); } 
    t = <NAME> { this.gb.addRuleItem(t.val,TokenRefType.NAME,t.startLine); }
|   itemName t = tokenRef { this.gb.addRuleItem(t.val, t.ext, t.startLine); }
|   itemName lexAction { this.gb.addAction(this.lexacts); }
;
tokenRef: 
    '<' t = <NAME> '>' { $$ = t; $$.ext = TokenRefType.TOKEN; } 
|   <STRING> { $$.ext = TokenRefType.STRING; }
;
ruleTrailer:
    /* empty */
|   rulePrec
|   rulePrec lexAction { this.gb.addAction(this.lexacts); }
;
rulePrec:
    '%prec' t = <NAME> { this.gb.defineRulePr(t.val, TokenRefType.NAME, t.startLine); }
|   '%prec' t = tokenRef { this.gb.defineRulePr(t.val, t.ext, t.startLine); }
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