
%lex [
    LETTER = < ['a'-'z', 'A'-'Z', '$', '_'] >
    DIGIT = < ['0'-'9'] >
    HEX = < ['0'-'9', 'a'-'f', 'A'-'F'] >
    ESCAPE_CHAR = < "\\" (['n', 't', 'b', 'r', 'f', '"', "'", "\\"] | <UNICODE>) >
    UNICODE = < ['x', 'u'] <HEX>+ >
    
    < ["\n", "\t", " ", "\r"]+ >: [='']
    < "/*" ([^"*", "/"]|[^"*"]"/"|"*"[^"/"])* "*/" >: [='']
    < "//" [^"\n"]* >: [='']

    < NAME: <LETTER> (<LETTER>|<DIGIT>)* >
    < NUM: <DIGIT>+ >
    < STRING: 
        '"' ( [^'"', '\n', '\\'] | <ESCAPE_CHAR> )* '"' 
    |   "'" ( [^"'", '\n', '\\'] | <ESCAPE_CHAR> )* "'"
    >
    < OPEN_BLOCK: "{" >
    < CLOSE_BLOCK: "}" >
    < OPT_DIR: "%option" >
    < LEX_DIR: "%lex" >
    < LEFT_DIR: "%left" >
    < RIGHT_DIR: "%right" >
    < NONASSOC_DIR: "%nonassoc" >
    < USE_DIR: "%use" >
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
]

%lex <IN_BLOCK> [
    < ANY_CODE: [^"{", "}"]* >
    < OPEN_BLOCK: "{" >
    < CLOSE_BLOCK: "}" >
]

%%

start: options '%%' body '%%';
options: options option | ;
option:
    '%lex' states_ '{' lexBody '}'
|   associativeDir assocTokens
|   '%option' '{' optionBody '}'
;
associativeDir: '%left' | '%right' | '%nonassoc';
assocTokens: assocTokens tokenRef | tokenRef;

optionBody: optionBody <NAME> '=' <STRING> |;

states_: '<' states '>' | ;
states: <NAME> | states ',' <NAME>;
lexBody: lexBody lexBodyItem | ;
lexBodyItem: 
    <NAME> '=' '<' regexp '>'
|   '<' regexp '>' lexAction_
|   '<' <NAME> ':' regexp '>' lexAction_
;
lexAction_: ':' lexAction | ;
lexAction: '[' lexActions ']' | block;
lexActions: lexActions ',' lexActionItem | lexActionItem;
lexActionItem: 
    '+' <NAME>
|   '-'
|   block
|   '=' <STRING>
;

regexp: regexp '|' simpleRE | simpleRE;
simpleRE: simpleRE basicRE | basicRE;
basicRE: primitiveRE rePostfix;
rePostfix: '+' | '?' | '*' |;
primitiveRE: 
    '(' regexp ')'
|   '[' inverse_ setRE_ ']'
|   '<' <NAME> '>'
|   <STRING>
;
inverse_: '^' |;
setRE_: setRE |;
setRE: setRE ',' setREItem | setREItem;
setREItem: <STRING> | <STRING> '-' <STRING>;

body: body bodyItem | bodyItem;
bodyItem: 
    compoundRule
;
compoundRule: <NAME> arrow rules ';';
arrow: ':' | '=>';
rules: rules '|' rule | rule;
rule: ruleHead ruleItems;
ruleHead: '%use' '(' varUseList ')' | ;
varUseList: varUseList ',' <NAME> | <NAME>;
ruleItems: ruleItems ruleItem |;
ruleItem: <NAME> | tokenRef | lexAction;
tokenRef: '<' <NAME> '>' | <STRING>;

block: [+IN_BLOCK] "{" innerBlock [-] "}";
innerBlock: innerBlock innerBlockItem |;
innerBlockItem: <ANY_CODE> | block;

%%