%header {
'use strict';
var Mathx = {};
function Quaternion(a, b, c, d){
    // this = a + bi + cj + dk
    this.a = a;
    this.b = b || 0;
    this.c = c || 0;
    this.d = d || 0;
}
Quaternion.prototype.toString = function(){
    return [this.a, this.b + 'i', this.c + 'j', this.d + 'k'].join(' + ');
}
Quaternion.prototype.neg = function(){
    return new Quaternion(-this.a, -this.b, -this.c, -this.d);
}
Quaternion.prototype.dagger = function(){
    return new Quaternion(this.a, -this.b, -this.c, -this.d);
}
Quaternion.prototype.inv = function(){
    var m2 = this.module2().a;
    return new Quaternion(this.a / m2, -this.b / m2, -this.c / m2, -this.d / m2);
}
Quaternion.prototype.module2 = function(){
    return new Quaternion(this.a * this.a + this.b * this.b + this.c * this.c + this.d * this.d);
}
Quaternion.prototype.module = function(){
    return new Quaternion(Math.sqrt(this.module2().a));
}
Mathx.Quaternion = Quaternion;

Quaternion.addQ = function(x, y){
    return new Quaternion(x.a + y.a, x.b + y.b, x.c + y.c, x.d + y.d);
}
Quaternion.minusQ = function(x, y){
    return new Quaternion(x.a - y.a, x.b - y.b, x.c - y.c, x.d - y.d);
}
Quaternion.multiQ = function(x, y){
    return new Quaternion(
        x.a * y.a - x.b * y.b - x.c * y.c - x.d * y.d,
        x.a * y.b + x.b * y.a + x.c * y.d - x.d * y.c,
        x.a * y.c - x.b * y.d + x.c * y.a + x.d * y.b,
        x.a * y.d + x.b * y.c - x.c * y.b + x.d * y.a
    );
}
Quaternion.exp = function(x){
    var fc = Math.exp(x.a);
    var mod2 = Math.sqrt(x.b * x.b + x.c * x.c + x.d * x.d);
    return new Quaternion(
        fc * Math.cos(mod2),
        fc * x.b * Math.sin(mod2) / mod2,
        fc * x.c * Math.sin(mod2) / mod2,
        fc * x.d * Math.sin(mod2) / mod2
    );
}

function cut(s){
    return s.substr(0, s.length - 1);
}
}

%extra_arg {
    var out;
}

%init {out1}{
    out = out1;
}

%lex {
    DIGIT = <['0'-'9']>
    LETTER = <['a'-'z', 'A'-'Z', '$', '_']>
    NUM = < (<DIGIT>+ ('.' <DIGIT>*)?|'.' <DIGIT>+ ) (['e', 'E']<DIGIT>+)? >

    < [' ', '\n', '\t', '\r']+ >: [='']

    // < NAME: <LETTER> (<LETTER>|<DIGIT>)* >: { $$ = vars + '.'$token.val; }
    < CONST: <NUM> >:        { $$ = new Quaternion(Number($token.val), 0, 0, 0); }
    < I: <NUM> ['i', 'I'] >: { $$ = new Quaternion(0, Number(cut($token.val)), 0, 0); }
    < J: <NUM> ['j', 'J'] >: { $$ = new Quaternion(0, 0, Number(cut($token.val)), 0); }
    < K: <NUM> ['k', 'K'] >: { $$ = new Quaternion(0, 0, 0, Number(cut($token.val))); }
    < PLUS: '+' >
    < MINUS: '-' >
    < TIMES: '*' >
    < DIVIDE: '/' >
    < ABS: '|' >
    < BRA: '(' >
    < KET: ')' >
    < EXP: 'exp' >
}

%left '+' '-'
%left '*' '/'
%left POS NEG
%right CONJ
%left '|'

%output "javascript"

// %type {Quaternion}

%%

start: a = expr { out.val = a; } ;
expr:
    a = expr '+' b = expr { $$ = Quaternion.addQ(a, b); }
|   a = expr '-' b = expr { $$ = Quaternion.minusQ(a, b); }
|   a = expr '*' b = expr { $$ = Quaternion.multiQ(a, b); }
|   a = expr '/' b = expr { $$ = Quaternion.multiQ(a, b.inv()) }
|   '+' a = expr %prec POS { $$ = a; }
|   '-' a = expr %prec NEG { $$ = a.neg(); }
|   a = expr '*' %prec CONJ { $$ = a.dagger(); }
|   '(' a = expr ')' { $$ = a; }
|   '|' a = expr '|' { $$ = a.module(); }
|   <CONST> | <I> | <J> | <K> 
|   funcs
;

funcs:
    'exp' '(' a = expr ')' { $$ = Quaternion.exp(a); }
;
%%

module.exports = function (s, args){
    var parser = createParser();
    var out = { val: null };
    var errMsg = null;
    parser.init(out);
    parser.on('lexicalerror', function(c, line, column){
        errMsg = ('invalid character "' + c + '" at line ' + (line + 1) + ' column ' + (column + 1));
        parser.halt();
    });
    parser.on('syntaxerror', function(msg, token){
        errMsg = ('syntax error: line ' + (token.startLine + 1) + ' column ' + (token.startColumn + 1) + ': ' + msg);
        parser.halt();
    });
    parser.on('accept', function(){
        // console.log('result: ' + out.val);
    });
    parser.accept(s);
    parser.end();
    if(errMsg !== null){
        throw errMsg;
    }
    return out.val;
};