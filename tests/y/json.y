// %token 'id' 'string' 'num' 'true' 'false' 'null'
// %token '[' ']' '{' '}' ',' ':'

%lex [
    LETTER = < ['a'-'z', 'A'-'Z', '$', '_'] >
    DIGIT = < ['0'-'9'] >
    HEX = < ['0'-'9', 'a'-'f', 'A'-'F'] >
    ESCAPE_CHAR = < "\\" (['n', 't', 'b', 'r', 'f', '"', "'", "\\"] | <UNICODE>) >
    UNICODE = < ['x', 'u'] <HEX>+ >
    DECIMAL = < <DIGIT>+ ( '.' <DIGIT>* )? | '.' <DIGIT>+ >

    < NAME: <LETTER> (<LETTER>|<DIGIT>)* >
    < NUM: <DECIMAL> ( ['e', 'E'] ['+', '-']? <DIGIT>* )? >
    < STRING: '"' ( [^'"', '\n', '\\'] | <ESCAPE_CHAR> )* '"' >
    < TRUE: 'true' >
    < FALSE: 'false' >
    < NULL: 'null' >
    < CBRA: '[' >
    < CKET: ']' >
    < BBRA: '{' >
    < BKET: '}' >
    < COMMA: ',' >
    < COLON: ':' >
]

%%

json: primitives | '[' array ']' | '{' obj '}';

primitives: <NAME> | <STRING> | <NUM> | 'true' | 'false' | 'null';

array: nearray comma | /* empty */;
nearray: nearray ',' json | json;

obj: neobj comma | /* empty */;
neobj: neobj ','oitem | oitem;
oitem: key ':' json;
key: <NAME> | <STRING>;

comma: ',' | /* empty */;

%%