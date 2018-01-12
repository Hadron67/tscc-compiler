%extra_arg{
    val: number;
}

%lex [
    DIGIT = <['0'-'9']>

    < [' ', '\n', '\t', '\r']+ >: [='']

    < NUM: 
        (<DIGIT>+ ('.' <DIGIT>*)?|'.' <DIGIT>+ ) (['e', 'E']<DIGIT>+)? 
    >: { $$ = Number($token.val); }
    < PLUS: '+' >
    < MINUS: '-' >
    < TIMES: '*' >
    < DIVIDE: '/' >
    < BRA: '(' >
    < KET: ')' >
]

%left '+' '-'
%left '*' '/'
%left POS NEG

%type number

%%

start: a = expr { this.val = a; } ;
expr:
    a = expr '+' b = expr { $$ = a + b; }
|   a = expr '-' b = expr { $$ = a - b; }
|   a = expr '*' b = expr { $$ = a * b; }
|   a = expr '/' b = expr { $$ = a / b; }
|   '+' a = expr %prec POS { $$ = a; }
|   '-' a = expr %prec NEG { $$ = -a; }
|   '(' a = expr ')' { $$ = a; }
|   <NUM> 
;

%%