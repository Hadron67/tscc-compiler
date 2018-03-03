// This grammar implements a simple calculator
%lex {
    DIGIT = < ['0'-'9'] >
    EXP_TRAILER = < ['e', 'E']['+', '-']? <DIGIT>+ >
    
    // numbers. Decimals and exponentials are allowed
    < NUM: ( <DIGIT>+ ('.' <DIGIT>*)? | '.' <DIGIT>+ ) <EXP_TRAILER>? >: { $$ = Number($token.val); }
    // operators
    < PLUS: '+' >
    < MINUS: '-' >
    < TIMES: '*' >
    < DIVIDE: '/' >
    // brackets
    < OPEN_BRACE: '(' >
    < CLOSE_BRACE: ')' >
}
// define operators' associativity and priority
%left '+' '-'
%left '*' '/'
// should be javascript, or test run will fail
%output 'javascript'
%%
start: expr { console.log('result: ' + $$); };
expr:
    a = expr '+' b = expr { $$ = a + b; }
|   a = expr '-' b = expr { $$ = a - b; }
|   a = expr '*' b = expr { $$ = a * b; }
|   a = expr '/' b = expr { $$ = a / b; }
|   '(' a = expr ')' { $$ = a; }
|   <NUM>
;
%%
var parser = createParser();
parser.parse(input);