%token 
'+' '-' '*' '/' '**' '?' ':' '%'
'>' '<' '>=' '<=' '==' '!='
'=' '+=' '-=' '*=' '/=' '&=' '|=' '^=' '>>=' '<<=' '%='
'|' '&' '^' '~'
'++' '--'
'&&' '||' '!'
'>>' '<<' '>>>'
'(' ')' '[' ']' ',' '{' '}'
'else'

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

%token 'id' 'num'
%token ';' 'if' 'while' 'do' 'for' 'function'

%%

topstmtlist: topstmtlist topstmt | /* empty */;

topstmt:
  stmt
| 'function' '(' argdeflist ')' '{' stmtlist '}'
;

argdeflist: neargdeflist | /* empty */;
neargdeflist: neargdeflist ',' 'id' | 'id';

stmtlist: stmtlist stmt | /* empty */;

stmt:
  ';'
| '{' stmtlist '}'
| exprlist ';'
| 'if' '(' exprlist ')' stmt elsestmt
| 'while' '(' exprlist ')' stmt
| 'do' stmt 'while' '(' exprlist ')' ';'
| 'for' '(' forexpr ';' forexpr ';' forexpr ')' stmt
;

elsestmt: 
  /* empty */ %prec 'else'
| 'else' stmt
;

forexpr: /* empty */ | exprlist;

exprlist: exprlist ',' expr | expr;

expr: 
  var aoptr expr %prec '='
| expr '?' expr ':' expr
| expr '||' expr
| expr '&&' expr
| expr '|' expr
| expr '^' expr
| expr '&' expr
| expr coptr expr %prec '>'
| expr '>>' expr | expr '<<' expr | expr '>>>' expr
| expr '+' expr | expr '-' expr
| expr '*' expr | expr '/' expr | expr '%' expr
| expr '**' expr
| '+' expr %prec POS
| '-' expr %prec POS
| '~' expr
| '!' expr
| const
| '(' expr ')'
| expr '(' arglist ')'
| var
| var '++'
| var '--'
| '++' var
| '--' var
;

aoptr: '=' | '+=' | '-=' | '*=' | '/=' | '&=' | '|=' | '^=' | '>>=' | '<<=' | '%=' ;
coptr: '>' | '<' | '>=' | '<=' | '==' | '!=' ;

arglist: narglist | /* empty */;
narglist: narglist ',' expr | expr;

const: 'num';

var: 'id' | expr '[' exprlist ']';

%%