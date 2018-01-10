%extra_arg{
    val: number;
}

%lex [
    DIGIT = <['0'-'9']>

    < [' ', '\n', '\t', '\r']+ >

    < NUM: <DIGIT>+ >
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
|   a = <NUM> { $$ = Number(a.val); }
;

%%