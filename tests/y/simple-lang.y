%lex [
    < (["\n", "\r", " ", "\t"] | "\r\n")+ >: [='']

    < PLUS: '+' >
    < MINUS: '-' >
    < TIMES: '*' >
    < DIVIDE: '/' >
    < EXP: '**' >
    < QUESTION: '?' >
    < COLON: ':' >
    < PERCENT: '%' >
    < GT: '>' >
    < LT: '<' >
    < GTOE: '>=' >
    < LTOE: '<=' >
    < EQU: '==' >
    < NEQ: '!=' >
    < ASSIGN: '=' >
    < PLUS_ASSIGN: '+=' >
    < MINUS_ASSIGN: '-=' >
    < TIMES_ASSIGN: '*=' >
    < DIVIDE_ASSIGN: '/=' >
    < BIT_AND_ASSIGN: '&=' >
    < BIT_OR_ASSIGN: '|=' > 
    < BIT_XOR_ASSIGN: '^=' >
    < RIGHT_SHIFT_ASSIGN: '>>=' >
    < LEFT_SHIFT_ASSIGN: '<<=' >
    < MOD_ASSIGN: '%=' >
    < BIT_AND: '&' >
    < BIT_OR: '|' >
    < BIT_XOR: '^' >
    < BIT_NOT: '~' >
    < INC: '++' >
    < DEC: '--' >
    < LEFT_SHIFT: '<<' >
    < RIGHT_SHIFT: '>>' >
    < RIGHT_SHIFT2: '>>>' >
    < BRA: '(' >
    < KET: ')' >
    < CBRA: '[' >
    < CKET: ']' >
    < COMMA: ',' >
    < BBRA: '{' >
    < BKET: '}' >
    < EOL: ';' >
    < AND: '&&' >
    < OR: '||' >
    < NOT: '!' >
    < IF: 'if' >
    < ELSE: 'else' >
    < WHILE: 'while' >
    < DO: 'do' >
    < FOR: 'for' >
    < FUNCTION: 'function' >

    DIGIT = < ['0'-'9'] >
    LETTER = < ['a'-'z', 'A'-'Z', '_', '$'] >
    < NAME: <LETTER> (<LETTER>|<DIGIT>)* >
    < NUM: <DIGIT>+ >
]

%right 'else'

%right '=' '+=' '-=' '*=' '/=' '&=' '|=' '^=' '>>=' '<<=' '%='
%left '?' ':'
%left '||'
%left '&&'
%right '!'
%left '|'
%left '^'
%left '&'
%right '~' '++' '--'
%left '>' '<' '>=' '<=' '==' '!='
%left '>>' '<<' '>>>'
%left '+' '-'
%left '*' '/' '%'
%right '**'
%left POS
%right '['
%right '('

%%

topstmtlist: topstmtlist topstmt | /* empty */;

topstmt:
    stmt
|   'function' '(' argdeflist ')' '{' stmtlist '}'
;

argdeflist: neargdeflist | /* empty */;
neargdeflist: neargdeflist ',' <NAME> | <NAME>;

stmtlist: stmtlist stmt | /* empty */;

stmt:
    ';'
|   '{' stmtlist '}'
|   exprlist ';'
|   'if' '(' exprlist ')' stmt elsestmt
|   'while' '(' exprlist ')' stmt
|   'do' stmt 'while' '(' exprlist ')' ';'
|   'for' '(' forexpr ';' forexpr ';' forexpr ')' stmt
;

elsestmt: 
    /* empty */ %prec 'else'
|   'else' stmt
;

forexpr: /* empty */ | exprlist;

exprlist: exprlist ',' expr | expr;

expr: 
    var aoptr expr %prec '='
|   expr '?' expr ':' expr
|   expr '||' expr { $$ = $1 + $3; }
|   expr '&&' expr
|   expr '|' expr
|   expr '^' expr
|   expr '&' expr
|   expr coptr expr %prec '>'
|   expr '>>' expr | expr '<<' expr | expr '>>>' expr
|   expr '+' expr | expr '-' expr
|   expr '*' expr | expr '/' expr | expr '%' expr
|   expr '**' expr
|   '+' expr %prec POS
|   '-' expr %prec POS
|   '~' expr
|   '!' expr
|   const
|   '(' expr ')'
|   expr '(' arglist ')'
|   var
|   var '++'
|   var '--'
;

aoptr: '=' | '+=' | '-=' | '*=' | '/=' | '&=' | '|=' | '^=' | '>>=' | '<<=' | '%=' ;
coptr: '>' | '<' | '>=' | '<=' | '==' | '!=' ;

arglist: narglist | /* empty */;
narglist: narglist ',' expr | expr;

const: <NUM>;

var: <NAME> | expr '[' exprlist ']' | '++' var | '--' var;

%%