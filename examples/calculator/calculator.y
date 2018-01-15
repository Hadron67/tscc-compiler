%header {
'use strict';
}

%extra_arg {
    var out;
}

%init {out1}{
    out = out1;
}

%lex {
    DIGIT = <['0'-'9']>
    LETTER = <['a'-'z', 'A'-'Z']>

    < [' ', '\n', '\t', '\r']+ >: [='']

//    < NAME: <LETTER> (<LETTER>|<DIGIT>)* >
    < NUM: 
        (<DIGIT>+ ('.' <DIGIT>*)?|'.' <DIGIT>+ ) (['e', 'E']<DIGIT>+)? 
    >: { $$ = Number($token.val); }
    < PLUS: '+' >
    < MINUS: '-' >
    < TIMES: '*' >
    < DIVIDE: '/' >
    < BRA: '(' >
    < KET: ')' >
    < SIN: 'sin' >
}

%left '+' '-'
%left '*' '/'
%left POS NEG

%output "javascript"

%%

start: a = expr { out.val = a; } ;
expr:
    a = expr '+' b = expr { $$ = a + b; }
|   a = expr '-' b = expr { $$ = a - b; }
|   a = expr '*' b = expr { $$ = a * b; }
|   a = expr '/' b = expr { $$ = a / b; }
|   '+' a = expr %prec POS { $$ = a; }
|   '-' a = expr %prec NEG { $$ = -a; }
|   '(' a = expr ')' { $$ = a; }
|   <NUM> 
|   funcs
;

funcs:
    'sin' '(' a = expr ')' { $$ = Math.sin(a); }
;
%%

module.exports = function calc(s){
    var parser = createParser();
    var out = { val: null };
    parser.init(out);
    parser.on('lexicalerror', function(msg, line, column){
        console.log(msg + ' at line ' + (line + 1) + ' column ' + (column + 1));
        parser.halt();
    });
    parser.on('syntaxerror', function(msg, token){
        console.log('syntax error: line ' + (token.startLine + 1) + ' column ' + (token.startColumn + 1) + ': ' + msg);
        parser.halt();
    });
    parser.on('accept', function(){
        // console.log('result: ' + out.val);
    });
    parser.accept(s);
    parser.end();
    return out.val;
};