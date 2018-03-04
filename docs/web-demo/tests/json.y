%lex {
    LETTER = < ['a'-'z', 'A'-'Z', '$', '_'] >
    DIGIT = < ['0'-'9'] >
    EXP_TRAILER = < ['e', 'E']['+', '-']? <DIGIT>+ >

    HEX = < ['0'-'9', 'a'-'f', 'A'-'F'] >
    ESCAPE_CHAR = < "\\" (['n', 't', 'b', 'r', 'f', '"', "'", "\\"] | <UNICODE>) >
    UNICODE = < ['x', 'u', 'X', 'U'] <HEX>+ >

    < ( ['\r', '\n', ' ', '\t'] | '\r\n')+ >: [='']

    < STRING: 
        '"' ( [^'"', '\n', '\\'] | <ESCAPE_CHAR> )* '"' 
    |   "'" ( [^"'", '\n', '\\'] | <ESCAPE_CHAR> )* "'"
    >: { $$ = $token.val; $$ = $$.substr(1, $$.length - 2); }
    < NAME: <LETTER> (<DIGIT>|<LETTER>)* >: { $$ = $token.val; }
    < NUM: ( <DIGIT>+ ('.' <DIGIT>*)? | '.' <DIGIT>+ ) <EXP_TRAILER>? >: { $$ = Number($token.val); }

    < TRUE: 'true' >
    < FALSE: 'false' >
    < NULL: 'null' >
    < OPEN_CUBIC_B: '[' >
    < CLOSE_CUBIC_B: ']' >
    < OPEN_CURLY_B: '{' >
    < CLOSE_CURLY_B: '}' >
    < OPEN_B: '(' >
    < CLOSE_B: ')' >
    < COMMA: ',' >
}

%%

json: primitives | '[' array ']' | '{' obj '}';

primitives: <ID> | <STRING> | <NUM> | 'true' | 'false' | 'null';

array: nearray comma | /* empty */;
nearray: nearray ',' json | json;

obj: neobj comma | /* empty */;
neobj: neobj ','oitem | oitem;
oitem: key ':' json;
key: <ID> | <STRING>;

comma: ',' | /* empty */;

%%