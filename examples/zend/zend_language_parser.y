%header {
// universal module defination
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.zend = {})));
}(this, (function (exports) \{ 'use strict';
var toString = {}.toString;
function isArray(a){
    return toString.call(a) === '[object Array]';
}
function ZNode(type, child, val, pos){
    this.parent = null;
    this.type = type;
    this.val = val || null;
    this.child = isArray(child) ? child : child === null || typeof child === 'undefined' ? [] : [child];
    this.pos = pos || null;
    for(var i = 0, _a = this.child; i < _a.length; i++){
        _a[i] !== ZNode.NONE && (_a[i].parent = this);
    }
}
ZNode.NONE = new ZNode(AST_NONE);
ZNode.prototype.add = function(c){
    this.child.push(c);
    c.parent = this;
}
ZNode.prototype.toString = function(){

}
ZNode.prototype.getPos = function(){
    var start = this;
    var end = this;
    while(start.child.length > 0){
        start = start.child[0];
    }
    while(end.child.length > 0){
        end = end.child[end.child.length - 1];
    }
    return {
        startLine: start.pos.startLine,
        startColumn: start.pos.startColumn,
        endLine: end.pos.endLine,
        endColumn: end.pos.endColumn
    };
}

function nodeFromToken(t){
    return new ZNode(AST_NONE, null, t.val, {
        startLine: t.startLine,
        startColumn: t.startColumn,
        endLine: t.endLine,
        endColumn: t.endColumn
    });
}
function nodeFromTrivalToken(t){
    return new ZNode(AST_NONE, null, null, {
        startLine: t.startLine,
        startColumn: t.startColumn,
        endLine: t.endLine,
        endColumn: t.endColumn
    });
}
function nodeBetween(from, to, val){
    return new ZNode(AST_NONE, null, val, {
        startLine: from.pos.startLine,
        startColumn: from.pos.startColumn,
        endLine: to.pos.endLine,
        endColumn: to.pos.endColumn
    });
}
var escapes = {
    'n': '\n',
    'f': '\f',
    'b': '\b',
    'r': '\r',
    't': '\t',
    '\\': '\\',
    '"': '"',
    "'": "'",
    '`': '`'
};
function unescape(s){
    let ret = '';
    let i = 0;
    while(i < s.length){
        let c = s.charAt(i);
        if(c === '\\'){
            c = s.charAt(++i);
            if(escapes[c]){
                ret += escapes[c];
                i++;
            }
            else if(c === 'u' || c === 'x'){
                c = s.charAt(++i);
                let hex = '';
                while(/[0-9a-fA-F]/.test(c)){
                    hex += c;
                    c = s.charAt(++i);
                }
                ret += String.fromCharCode(parseInt(hex, 16));
            }
        }
        else {
            ret += c;
            i++;
        }
    }
    return ret;
}
function extractHeredocStart(s){
    s = s.substr(3, s.length - 4).trim();
    if(s.charAt(0) === '"' || s.charAt(0) === "'"){
        s = s.substr(1, s.length - 2);
    }
    return s;
}


var cc = 0;
function defineOpcode(name, handler){
    return {
        code: cc++,
        name: name,
        handler: handler || null
    };
}
var OP_NOP = defineOpcode('nop');
var OP_PUSH = defineOpcode('push');
var OP_POP = defineOpcode('pop');
var OP_DUP = defineOpcode('dup');
var OP_GETVAR = defineOpcode('getVar');
var OP_SETVAR = defineOpcode('setVar');
var OP_SETPROP = defineOpcode('setProp');
var OP_GETPROP = defineOpcode('getProp');
var OP_GETOFFSET = defineOpcode('getOffset');
var OP_SETOFFSET = defineOpcode('setOffset');
var OP_GETMAXOFFSET = defineOpcode('getMaxOffset');
var OP_SETMAXOFFSET = defineOpcode('setMaxOffset');
var OP_GETCONST = defineOpcode('getConst');
var OP_SETLOCAL = defineOpcode('setLocal');
var OP_GETLOCAL = defineOpcode('getLocal');

var OP_PLUS = defineOpcode('plus');
var OP_MINUS = defineOpcode('minus');
var OP_TIMES = defineOpcode('times');
var OP_DIVIDE = defineOpcode('divide');
var OP_POW = defineOpcode('pow');
var OP_CONCAT = defineOpcode('concat');
var OP_MOD = defineOpcode('mod');
var OP_BITAND = defineOpcode('bitAnd');
var OP_BITOR = defineOpcode('bitOr');
var OP_BITXOR = defineOpcode('bitXor');
var OP_BITNOT = defineOpcode('bitNot');
var OP_AND = defineOpcode('and');
var OP_OR = defineOpcode('or');
var OP_NOT = defineOpcode('not');
var OP_XOR = defineOpcode('xor');
var OP_LEFTSHIFT = defineOpcode('leftShift');
var OP_RIGHTSHIFT = defineOpcode('rightShift');
var OP_POSITIVE = defineOpcode('positive');
var OP_NEGATIVE = defineOpcode('negative');
var OP_INC = defineOpcode('inc');
var OP_DEC = defineOpcode('dec');
var OP_GREATERTHAN = defineOpcode('greaterThan');
var OP_LESSTHAN = defineOpcode('lessThan');
var OP_EQUAL = defineOpcode('equal');
var OP_IDENTICAL = defineOpcode('identical');
var OP_GREATERTHANOREQUAL = defineOpcode('greaterThanOrEqual');
var OP_LESSTHANOREQUAL = defineOpcode('lessThanOrEqual');
var OP_NOTEQUAL = defineOpcode('notEqual');
var OP_NOTIDENTICAL = defineOpcode('notIdentical');
var OP_ECHO = defineOpcode('echo');

var OP_ARRAY = defineOpcode('array');
var OP_ADDARRAYITEM = defineOpcode('addArrayItem');
var OP_ADDARRAYPAIR = defineOpcode('addArrayPair');

var OP_BOOLCAST = defineOpcode('boolCast');

var OP_INVOKE = defineOpcode('invoke');
var OP_INVOKENAME = defineOpcode('invokeName');
var OP_INVOKEMETHOD = defineOpcode('invokeMethod');
var OP_INVOKEMETHODNAME = defineOpcode('invokeMethodName');
var OP_NEW = defineOpcode('new');
var OP_DEFINEFUNCTION = defineOpcode('defineFunction');
var OP_ENTRY = defineOpcode('entry');
var OP_PARAM = defineOpcode('param');
var OP_USE = defineOpcode('use');
var OP_ENDFUNCTION = defineOpcode('endFunction');

var OP_JMP = defineOpcode('jmp');
var OP_JZ = defineOpcode('jz');
var OP_JNZ = defineOpcode('jnz');
var OP_RETURN = defineOpcode('return');
var OP_RETURNNULL = defineOpcode('returnNull');
var OP_CODE = defineOpcode('code');
var OP_ENDCODE = defineOpcode('endCode');

cc = 0;
var AST_NONE = cc++;
var AST_TOPLIST = cc++;
var AST_STATEMENTLIST = cc++;
var AST_ECHO = cc++;
var AST_IF = cc++;
var AST_WHILE = cc++;
var AST_DO_WHILE = cc++;
var AST_FOR = cc++;
var AST_EXPR_LIST = cc++;
var AST_CONDITIONALEXPR = cc++;
var AST_ARGLIST = cc++;
var AST_PARAMLIST = cc++;
var AST_LEXICALVARLIST = cc++;
var AST_FUNCTIONCALL = cc++;
var AST_METHODCALL = cc++;
var AST_FUNCTION = cc++;
var AST_ANONYFUNCTION = cc++;
var AST_BREAK = cc++;
var AST_CONTINUE = cc++;
var AST_RETURN = cc++;

var AST_VARIABLE = cc++;
var AST_PROPERTY = cc++;
var AST_OFFSET = cc++;
var AST_ASSIGN = cc++;
var AST_BINARYOP = cc++;
var AST_UNARYOP = cc++;
var AST_LOGICALOR = cc++;
var AST_LOGICALAND = cc++;
var AST_POSTINC = cc++;
var AST_SUFFIXINC = cc++;
var AST_POSTDEC = cc++;
var AST_SUFFIXDEC = cc++;

var AST_CONST = cc++;
var AST_INTEGER = cc++;
var AST_FLOAT = cc++;
var AST_STRING = cc++;
var AST_STRING_LIST = cc++;
var AST_NONE_END_LABEL = cc++;
var AST_ARRAY = cc++;
var AST_ARRAYPAIR = cc++;
var AST_LOCAL = cc++;

}

%output "javascript"

%lex {
    NEWLINE = < "\n"|"\r"|"\r\n" >
    
    < INLINE_HTML: [^'<']+ | '<'[^"<"]* >: { $$ = nodeFromToken($token); }
    < %least "<?php" ([" ", "\t"]|<NEWLINE>) >: [+IN_SCRIPTING]
    < ECHO_TAG: %least "<?=" >: [+IN_SCRIPTING]
}

%lex <IN_SCRIPTING> {
    LABEL = < ['a'-'z', 'A'-'Z', '_', '\x80'-'\xff']['a'-'z', 'A'-'Z', '_', '0'-'9', '\x80'-'\xff']* >
    NUM = < ['0'-'9'] >
    HEX = < ['a'-'f', 'A'-'F', '0'-'9'] >
    TAB_AND_SPACE = < ["\t", " "]+ >
    WHITESPACE = < ( <TAB_AND_SPACE> | <NEWLINE> )+ >
    ESCAPE_CHAR = < "\\" ( ['n', 'r', 'f', 'b', 't', '\\', '"', "'"] | ['u', 'x'] <HEX>+ ) >

    < <WHITESPACE> >: [='']
    < ('#'|'//') [^'\n']* >: [='']
    < "/*" ([^"*", "/"]|[^"*"]"/"|"*"[^"/"])* "*/" >: [='']
    < '?>' >: [='', -]

    < NAME: <LABEL> >: { $$ = nodeFromToken($token); }
    < DECIMAL: ( <NUM>+ ('.' <NUM>*)? | '.' <NUM>+ ) (['e', 'E']['+', '-']?<NUM>+)? >
    : { $$ = nodeFromToken($token); $$.val = Number($$.val); }
    < INT: <NUM>+ >: { $$ = nodeFromToken($token); $$.val = Number($$.val); }
    < STRING: "'" ( [^"'", "\\"] | <ESCAPE_CHAR> )* "'"  >
    : { $$ = nodeFromToken($token); $$.val = unescape($$.val.substr(1, $$.val.length - 2)); }
    < DOUBLE_QUOTE: '"' >
    < BACK_QUOTE: '`' >

    < DOLLAR: '$' >
    < VARIABLE: '$' <LABEL> >: { $$ = nodeFromToken($token); $$.val = $$.val.substr(1, $$.val.length - 1); }

    < HALT_COMPILER: "__halt_compiler" >
    < PLUS: '+' >
    < MINUS: '-' >
    < TIMES: '*' >
    < DIVIDE: '/' >
    < POW: '**' >
    < QUESTION: '?' >
    < COLON: ':' >
    < PERCENT: '%' >
    < GT: '>' >
    < LT: '<' >
    < GTOE: '>=' >
    < LTOE: '<=' >
    < EQU: '==' >
    < IDENTICAL: '===' >
    < NEQ: '!=' >
    < NIDENTICAL: '!==' >
    < ASSIGN: '=' >
    < PLUS_ASSIGN: '+=' >
    < MINUS_ASSIGN: '-=' >
    < TIMES_ASSIGN: '*=' >
    < POW_ASSIGN: '**=' >
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

    < HEREDOC_HEADER: 
        '<<<' <TAB_AND_SPACE> ( <LABEL> | '"' <LABEL> '"' ) <NEWLINE>
    >: { $$ = nodeFromToken($token); $$.val = extractHeredocStart($$.val); }
    < NOWDOC_HEADER: 
        '<<<' <TAB_AND_SPACE> "'" <LABEL> "'" <NEWLINE>
    >: { $$ = nodeFromToken($token); $$.val = extractHeredocStart($$.val); }
    < ARROW: '=>' >
    < PROPERTY_ARROW: '->' >
    < BRA: '(' >
    < KET: ')' >
    < CBRA: '[' >
    < CKET: ']' >
    < COMMA: ',' >: { $$ = nodeFromTrivalToken($token); }
    < BBRA: '{' >
    < BKET: '}' >
    < EOL: ';' >
    < AND: '&&' >
    < OR: '||' >
    < LOGICAL_OR: 'OR' >
    < LOGICAL_AND: 'AND' >
    < LOGICAL_XOR: 'XOR' >
    < NOT: '!' >
    < IF: 'if' >
    < ELSE: 'else' >
    < ECHO: "echo" >
    < WHILE: 'while' >
    < DO: 'do' >
    < FOR: 'for' >
    < FUNCTION: 'function' >: { $$ = nodeFromTrivalToken($token); }
    < LIST: 'list' >
    < ARRAY: 'array' >
    < USE: 'use' >
    < BREAK: 'break' >: { $$ = nodeFromTrivalToken($token); }
    < CONTINUE: 'continue' >: { $$ = nodeFromTrivalToken($token); }
    < RETURN: 'return' >
    < DOT: '.' >
}

%lex <LOOKING_FOR_PROPERTY> {
    < <WHITESPACE> >: [='']

    < NAME: <LABEL> >: { $$ = nodeFromToken($token); }
    < DOLLAR: '$' >
    < BBRA: '{' >
    < VARIABLE: '$' <LABEL> >: { $$ = nodeFromToken($token); $$.val = $$.val.substr(1, $$.val.length - 1); }
}

%lex <IN_DOUBLE_QUOTE> {
    < ANY_CONTENT: [^"$", '\\', '"']+ >: { $$ = nodeFromToken($token); }
    < DOUBLE_QUOTE: '"' >: { $$ = nodeFromTrivalToken($token); }
}

%lex <IN_BACKQUOTE> {
    < ANY_CONTENT: [^"$", '\\', '`']+ >: { $$ = nodeFromToken($token); }
    < BACK_QUOTE: '`' >: { $$ = nodeFromTrivalToken($token); }
}

%lex <IN_HEREDOC> {
    < ANY_CONTENT: [^"$", '\n', '\r', '\\']+ | <NEWLINE> >: { $$ = nodeFromToken($token); }
    < HEREDOC_END_LABEL: <NEWLINE> <LABEL> >: { $$ = nodeFromToken($token); }
}

%lex <IN_NOWDOC> {
    < ANY_CONTENT: [^'\n', '\r', '\\']+ | <NEWLINE> >: { $$ = nodeFromToken($token); }
    < HEREDOC_END_LABEL: <NEWLINE> <LABEL> >: { $$ = nodeFromToken($token); }
}

%lex <IN_DOUBLE_QUOTE, IN_BACKQUOTE, IN_HEREDOC> {
    < ANY_CONTENT: '\\' <ESCAPE_CHAR> >: { $$ = nodeFromToken($token); $$.val = unescape($$.val); }
    < ANY_CONTENT: '\\$' >: { $$ = nodeFromToken($token); $$.val = '$'; }
    < VARIABLE_IN_STRING: "$" <LABEL> >: { $$ = nodeFromToken($token); $$.val = $$.val.substr(1, $$.val.length - 1); }
    < VARIABLE_IN_STRING: "${" <LABEL> "}" >: { $$ = nodeFromToken($token); $$.val = $$.val.substr(2, $$.val.length - 3); }
    < PROPERTY_IN_STRING: "$" <LABEL> '->' <LABEL> >: {
        $$ = nodeFromToken($token);
        var parts = $$.val.substr(1, $$.val.length - 1).split('->');
        $$.val = parts[0];
        propertyName = parts[1];
    }
    < OFFSET_IN_STRING: "$" <LABEL> "[" >: { $$ = nodeFromToken($token); $$.val = $$.val.substr(1, $$.val.length - 2); }
    < OPEN_CURLY_BRACE: '${' >
}

%token <END_OF_HEREDOC>

%right 'else' <INLINE_HTML>

%left 'OR' 'XOR' 'AND'
%right '=' '+=' '-=' '*=' '/=' '&=' '|=' '^=' '>>=' '<<=' '%=' '**='
%left '?' ':'
%left '||'
%left '&&'
%right '!'
%left '|'
%left '^'
%left '&'
%right '~' '++' '--'
%left '>' '<' '>=' '<=' '==' '!=' '===' '!=='
%left '>>' '<<'
%left '+' '-' '.'
%left '*' '/' '%'
%right '**'
%left UNARY

%extra_arg {
    var outputs;
    var heredocStart;
    var propertyName;
}

%init {outputs1}{
    outputs = outputs1;
    heredocStart = [];
}

%%
start: l = top_statement_list { outputs.astRoot = l; };
top_statement_list: 
    top_statement_list st = top_statement { st !== null && $$.add(st); }
|   /* empty */ { $$ = new ZNode(AST_TOPLIST); }
;

top_statement:
    statement
|   function_declaration_statement
|   "__halt_compiler" '(' ')' ';' { halt(); }
;

statement_list: 
    statement_list st = statement { st !== null && $$.add(st); }
|   /* empty */ { $$ = new ZNode(AST_STATEMENTLIST); }
;

statement:
    '{' l = statement_list '}' { $$ = l; }
|   ';' { $$ = null; }
|   e = expr ';' { $$ = new ZNode(AST_EXPR_LIST, e); }
|   l = inline_html_list %prec <INLINE_HTML> 
    { $$ = new ZNode(AST_ECHO, l); }
|   <ECHO_TAG> e = expr <INLINE_HTML> { $$ = new ZNode(AST_ECHO, e); }
|   'echo' e = echo_expr_list ';' { $$ = e; }
|   if_statement
|   'while' '(' cond = expr ')' s = statement { $$ = new ZNode(AST_WHILE, [cond, s]); }
|   'do' s = statement 'while' '(' cond = expr ')' ';' 
    { $$ = new ZNode(AST_DO_WHILE, [cond, s]); }
|   'for' '(' e1 = for_exprs ';' e2 = for_exprs ';' e3 = for_exprs ')' s = statement
    { $$ = new ZNode(AST_FOR, [e1, e2, e3, s]); }
|   'return' e = optional_expr ';' { $$ = new ZNode(AST_RETURN, e); }
|   'break' n = optional_num ';' { $$.type = AST_BREAK; $$.add(n); }
|   'continue' n = optional_num ';' { $$.type = AST_CONTINUE; $$.add(n); }
;

inline_html_list:
    inline_html_list h = <INLINE_HTML> { $$ = nodeBetween($$, h, $$.val + h.val); $$.type = AST_STRING; }
|   <INLINE_HTML> { $$.type = AST_STRING; }
;

echo_expr_list:
    echo_expr_list ',' e = expr { $$.add(e); }
|   e = expr { $$ = new ZNode(AST_ECHO, e); }
;

optional_num: <INT> | { $$ = ZNode.NONE; } ;

if_statement:
    'if' '(' c = expr ')' s = statement %prec 'else' { $$ = new ZNode(AST_IF, [c, s, ZNode.NONE]); }
|   'if' '(' c = expr ')' s = statement 'else' el = statement
    { $$ = new ZNode(AST_IF, [c, s, el]); }
;

for_exprs:
    /* empty */ { $$ = new ZNode(AST_EXPR_LIST); }
|   non_empty_for_exprs
;
non_empty_for_exprs:
    non_empty_for_exprs ',' e = expr { $$.add(e); }
|   e = expr { $$ = new ZNode(AST_EXPR_LIST, e); }
;

expr:
    var
|   expr_without_var
;

callable_expr:
    callable_variable
|   '(' e = expr ')' { $$ = e; }
;

dereferencable:
    var
|   '(' e = expr ')' { $$ = e; }
|   dereferencable_primitive
;

dereferencable_primitive:
    '[' a = array_pair_list ']' { $$ = a; }
|   'array' '(' a = array_pair_list ')' { $$ = a; }
|   <STRING> { $$.type = AST_STRING; }
;

var:
    callable_variable
|   v = dereferencable pn = arrow_and_property
    { $$ = new ZNode(AST_PROPERTY, [v, pn]); }
;
callable_variable:
    simple_var
|   v = dereferencable '[' e = optional_expr ']' 
    { $$ = new ZNode(AST_OFFSET, [v, e]); }
|   v = dereferencable pn = arrow_and_property '(' l = argument_list ')'
    { $$ = new ZNode(AST_METHODCALL, [v, pn, l]); }
;
simple_var: 
    v = <VARIABLE> { v.type = AST_STRING; $$ = new ZNode(AST_VARIABLE, v); }
|   '$' '{' e = expr '}' { $$ = new ZNode(AST_VARIABLE, e); }
|   '$' v = simple_var { $$ = new ZNode(AST_VARIABLE, v); }
;

arrow_and_property:
    '->' [+LOOKING_FOR_PROPERTY] pn = property_name [-] { $$ = pn; }
;
property_name:
    n = <NAME> { $$.type = AST_STRING; }
|   '{' e = expr '}' { $$ = e; }
|   simple_var
;

optional_expr:
    /* empty */ { $$ = ZNode.NONE; }
|   expr
;

function_call:
    fn = <NAME> '(' l = argument_list ')'
    { fn.type = AST_STRING; $$ = new ZNode(AST_FUNCTIONCALL, [fn, l]); }
|   f = callable_expr '(' l = argument_list ')'
    { $$ = new ZNode(AST_FUNCTIONCALL, [f, l]); }
;

argument_list:
    /* empty */ { $$ = new ZNode(AST_ARGLIST); }
|   non_empty_argument_list
;
non_empty_argument_list:
    non_empty_argument_list ',' e = expr { $$.add(e); }
|   e = expr { $$ = new ZNode(AST_ARGLIST, e); }
;

expr_without_var:
    'list' '(' l = array_pair_list ')' '=' e = expr 
    { $$ = new ZNode(AST_ASSIGN, [l, e]); }
|   '[' l = array_pair_list ']' '=' e = expr 
    { $$ = new ZNode(AST_ASSIGN, [l, e]); }
|   a = var '=' b = expr 
    { $$ = new ZNode(AST_ASSIGN, [a, b]); }
|   a = var '+=' b = expr 
    { $$ = new ZNode(AST_ASSIGN, [a, b], OP_PLUS); }
|   a = var '-=' b = expr 
    { $$ = new ZNode(AST_ASSIGN, [a, b], OP_MINUS); }
|   a = var '**=' b = expr 
    { $$ = new ZNode(AST_ASSIGN, [a, b], OP_POW); }
|   a = var '*=' b = expr 
    { $$ = new ZNode(AST_ASSIGN, [a, b], OP_TIMES); }
|   a = var '/=' b = expr 
    { $$ = new ZNode(AST_ASSIGN, [a, b], OP_DIVIDE); }
|   a = var '&=' b = expr
    { $$ = new ZNode(AST_ASSIGN, [a, b], OP_BITAND); }
|   a = var '|=' b = expr 
    { $$ = new ZNode(AST_ASSIGN, [a, b], OP_BITOR); }
|   a = var '^=' b = expr 
    { $$ = new ZNode(AST_ASSIGN, [a, b], OP_BITXOR); }
|   a = var '>>=' b = expr 
    { $$ = new ZNode(AST_ASSIGN, [a, b], OP_RIGHTSHIFT); }
|   a = var '<<=' b = expr
    { $$ = new ZNode(AST_ASSIGN, [a, b], OP_LEFTSHIFT); }
|   a = var '%=' b = expr 
    { $$ = new ZNode(AST_ASSIGN, [a, b], OP_MOD); }

|   a = expr '?' b = expr ':' c = expr { $$ = new ZNode(AST_CONDITIONALEXPR, [a, b, c]); }
|   a = expr '?' ':' c = expr { $$ = new ZNode(AST_CONDITIONALEXPR, [a, ZNode.NONE, c]); }

|   a = expr '>' b = expr   { $$ = new ZNode(AST_BINARYOP, [a, b], OP_GREATERTHAN);        }
|   a = expr '<' b = expr   { $$ = new ZNode(AST_BINARYOP, [a, b], OP_LESSTHAN);           }
|   a = expr '>=' b = expr  { $$ = new ZNode(AST_BINARYOP, [a, b], OP_GREATERTHANOREQUAL); }
|   a = expr '<=' b = expr  { $$ = new ZNode(AST_BINARYOP, [a, b], OP_LESSTHANOREQUAL);    }
|   a = expr '==' b = expr  { $$ = new ZNode(AST_BINARYOP, [a, b], OP_EQUAL);              }
|   a = expr '===' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_IDENTICAL);          }
|   a = expr '!=' b = expr  { $$ = new ZNode(AST_BINARYOP, [a, b], OP_NOTEQUAL);           }
|   a = expr '!==' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_NOTIDENTICAL);       }

|   a = expr '^' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_BITXOR);      }
|   a = expr '|' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_BITOR);       }
|   a = expr '&' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_BITAND);      }
|   a = expr '>>' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_RIGHTSHIFT); }
|   a = expr '<<' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_LEFTSHIFT);  }

|   a = expr '&&' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_AND); }
|   a = expr '||' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_OR);  }

|   a = expr 'OR' b = expr { $$ = new ZNode(AST_LOGICALOR, [a, b]);         }
|   a = expr 'XOR' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_XOR); }
|   a = expr 'AND' b = expr { $$ = new ZNode(AST_LOGICALAND, [a, b]);       }

|   a = expr '+' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_PLUS);   }
|   a = expr '-' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_MINUS);  }
|   a = expr '*' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_TIMES);  }
|   a = expr '/' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_DIVIDE); }
|   a = expr '%' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_MOD);    }
|   a = expr '**' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_POW);   }
|   a = expr '.' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_CONCAT); }
|   '(' a = expr ')' { $$ = a; }
|   '+' a = expr %prec UNARY { $$ = new ZNode(AST_UNARYOP, a, OP_POSITIVE); }
|   '-' a = expr %prec UNARY { $$ = new ZNode(AST_UNARYOP, a, OP_NEGATIVE); }
|   '!' a = expr { $$ = new ZNode(AST_UNARYOP, a, OP_NOT);    }
|   '~' a = expr { $$ = new ZNode(AST_UNARYOP, a, OP_BITNOT); }
|   '++' a = var { $$ = new ZNode(AST_POSTINC, a);   }
|   '--' a = var { $$ = new ZNode(AST_POSTDEC, a);  }
|   a = var '++' { $$ = new ZNode(AST_SUFFIXINC, a); }
|   a = var '--' { $$ = new ZNode(AST_SUFFIXDEC, a); }
|   '`' [+IN_BACKQUOTE] l = quote_list '`' [-] { $$ = l; }
|   primitive
|   'function' '(' l = parameter_list ')' ll = lexical_vars '{' b = statement_list '}'
    { $$ = new ZNode(AST_ANONYFUNCTION, [l, ll, b]); }
|   function_call
;

function_declaration_statement:
    'function' n = <NAME> '(' l = parameter_list ')' '{' b = statement_list '}'
    { n.type = AST_STRING; $$ = new ZNode(AST_FUNCTION, [n, l, b]); }
;
parameter_list:
    /* empty */ { $$ = new ZNode(AST_PARAMLIST); }
|   non_empty_parameter_list
;
non_empty_parameter_list:
    non_empty_parameter_list ',' p = parameter { $$.add(p); }
|   p = parameter { $$ = new ZNode(AST_PARAMLIST, p); }
;
parameter: <VARIABLE> { $$.type = AST_STRING; };

lexical_vars:
    /* empty */ { $$ = new ZNode(AST_LEXICALVARLIST); }
|   'use' '(' l = lexical_var_list ')' { $$ = l; }
;
lexical_var_list:
    lexical_var_list ',' v = <VARIABLE> { v.type = AST_STRING; $$.add(v); }
|   v = <VARIABLE> { v.type = AST_STRING; $$ = new ZNode(AST_LEXICALVARLIST, v); }
;

primitive:
    s = <INT> { s.type = AST_INTEGER; $$ = s; }
|   s = <DECIMAL> { s.type = AST_FLOAT; $$ = s; }
|   s = <NAME> { s.type = AST_CONST; $$ = s; }
|   '"' [+IN_DOUBLE_QUOTE] l = quote_list '"' [-] { $$ = l; }
|   h = <HEREDOC_HEADER> [+IN_HEREDOC] { heredocStart.push(h.val); } 
    l = heredoc_list <END_OF_HEREDOC> [-] { $$ = l; }
|   h = <NOWDOC_HEADER> [+IN_NOWDOC] { heredocStart.push(h.val); } 
    l = heredoc_list <END_OF_HEREDOC> [-] { $$ = l; }
|   dereferencable_primitive
;

heredoc_list:
    heredoc_list i = heredoc_item { i !== null && $$.add(i); }
|   { $$ = new ZNode(AST_STRING_LIST); } 
;
heredoc_item:
    n = <HEREDOC_END_LABEL> { 
        if(n.val.trim() === heredocStart[heredocStart.length - 1]){ 
            $emit<END_OF_HEREDOC>; 
            heredocStart.pop(); 
            $$ = null; 
        }
        else {
            $$.type = AST_STRING;
        }
    }
|   encaps
;

quote_list:
    quote_list e = encaps { $$.add(e); }
|   { $$ = new ZNode(AST_STRING_LIST); }
;

encaps:
    <ANY_CONTENT> { $$.type = AST_STRING; }
|   v = <VARIABLE_IN_STRING> { v.type = AST_STRING; $$ = new ZNode(AST_VARIABLE, v); }
|   pn = <PROPERTY_IN_STRING> { 
        pn.type = AST_STRING; 
        $$ = new ZNode(AST_PROPERTY, [new ZNode(AST_VARIABLE, pn), new ZNode(AST_STRING, null, propertyName, pn)]); 
    }
|   v = <OFFSET_IN_STRING> [+IN_SCRIPTING] e = expr ']' [-] {
        v.type = AST_STRING;
        $$ = new ZNode(AST_OFFSET, [new ZNode(AST_VARIABLE, v), e]); 
    }
|   '${' [+IN_SCRIPTING] e = expr '}' [-] { $$ = e; }
;

array_pair_list: non_empty_array_pair_list;
non_empty_array_pair_list:
    non_empty_array_pair_list ',' a = array_pair { $$.add(a); }
    // get line information for an empty entry
|   non_empty_array_pair_list a = ',' { a.type = AST_NONE; $$.add(a); }
|   a = possible_array_pair { $$ = new ZNode(AST_ARRAY, a); }
;
possible_array_pair: array_pair | /* empty */ { $$ = ZNode.NONE; };
array_pair:
    expr
|   a = expr '=>' b = expr { $$ = new ZNode(AST_ARRAYPAIR, [a, b]); }
;
%%

function OpArray(){
    this.opcode = [];
    this.opCount = 0;
    this.functions = [];
}
OpArray.prototype.dump = function(){
    function rightAlign(s, al){
        function repeat(s, t){
            let ret = '';
            while(t --> 0) ret += s;
            return ret;
        }
        return s + (s.length < al ? repeat(' ', al - s.length) : '');
    }
    var ret = [];
    var labels = [];
    var labelMaxLen = 0;
    var labelCount = 0;
    var labelOps = [];
    for(var i = 0, _a = this.opcode; i < this.opCount; i++){
        var op = _a[2 * i];
        var line = op.name;
        var arg = _a[2 * i + 1];
        if(op === OP_JMP || op === OP_JZ || op === OP_JNZ || op === OP_ENTRY){
            var l = labels[arg] = 'label' + labelCount++;
            l.length > labelMaxLen && (labelMaxLen = l.length);
            labelOps.push({ op: op, loc: i, target: arg });
            ret.push(null);
        }
        else {
            if(arg !== null){
                if(isArray(arg)){
                    for(var j = 0; j < arg.length; j++){
                        line += ' ' + arg[j];
                    }
                }
                else {
                    if(typeof arg === 'string'){
                        arg = '"' + arg.replace(/\n/g, '\\n') + '"';
                    }
                    line += ' ' + String(arg);
                }
            }
            ret.push(line);
        }
    }
    for(var i = 0, _a = labelOps; i < _a.length; i++){
        ret[_a[i].loc] = _a[i].op.name + ' ' + labels[_a[i].target];
    }
    for(var i = 0; i < ret.length; i++){
        var l = labels[i];
        if(l !== undefined){
            ret[i] = rightAlign(l + ':', labelMaxLen + 2) + ret[i];
        }
        else {
            ret[i] = rightAlign('', labelMaxLen + 2) + ret[i];
        }
    }
    return ret;
}

function createCompiler(fname){
    var opa = new OpArray();
    var registers = [];
    var scope = [];
    var onErr = [];
    var funcQueue = [];

    var localNode = new ZNode(AST_LOCAL);
    
    function LoopInfo(allowBreak, allowContinue){
        this.allowBreak = allowBreak;
        this.allowContinue = allowContinue;
        this.breaks = [];
        this.continues = [];
    }
    LoopInfo.prototype.done = function(bl, cl){
        for(var i = 0, _a = this.breaks; i < _a.length; i++){
            setArg(_a[i], bl);
        }
        for(var i = 0, _a = this.continues; i < _a.length; i++){
            setArg(_a[i], cl);
        }
    }

    return {
        compile: compile,
        addErrHandler: addErrHandler
    };

    function addErrHandler(cb){
        onErr.push(cb);
    }
    function err(msg){
        for(var i = 0; i < onErr.length; i++){
            onErr[i](msg);
        }
    }
    function singlePosErr(msg, pos){
        var p = pos.getPos();
        err(msg + ' (at line ' + (p.startLine + 1) + ')');
    }
    function allocateRegister(){
        var i = 0;
        while(registers[i] !== undefined){ i++; };
        registers[i] = true;
        return i;
    }
    function releaseRegister(i){
        if(i === registers.length - 1){
            registers.pop();
        }
        else {
            registers[i] = undefined;
        }
    }
    function pushScope(){
        scope.push(registers);
        registers = [];
    }
    function popScope(){
        registers = scope.pop();
    }
    function emit(s, args){
        opa.opcode.push(s);
        opa.opcode.push(typeof args !== 'undefined' ? args : null);
        return opa.opCount++;
    }
    function setArg(op, arg){
        opa.opcode[op * 2 + 1] = arg;
    }
    function breakTarget(ast, level){
        level = level || 1;
        var p = ast;
        while(level --> 0 && p !== null){
            while(p !== null){
                if(p.val instanceof LoopInfo && p.val.allowBreak){
                    break;
                }
                p = p.parent;
            }
        }
        return p;
    }
    function continueTarget(ast, level){
        level = level || 1;
        var p = ast;
        while(level --> 0 && p !== null){
            while(p !== null){
                if(p.val instanceof LoopInfo && p.val.allowContinue){
                    break;
                }
                p = p.parent;
            }
        }
        return p;
    }

    function compile(astRoot){
        compileBlock(astRoot);
        return opa;
    }
    function compileBlock(ast){
        for(var i = 0, _a = ast.child; i < _a.length; i++){
            var func = _a[i];
            if(func.type === AST_FUNCTION){
                emit(OP_DEFINEFUNCTION, func.child[0].val);
                var entry = emit(OP_ENTRY);
                var params = [];
                for(var j = 0, _b = func.child[1].child; i < _b.length; i++){
                    params.push(_b[j].val);
                }
                emit(OP_PARAM, params);
                emit(OP_ENDFUNCTION);
                funcQueue.push({ body: func.child[2], entryOp: entry });   
            }
        }
        for(var i = 0, _a = ast.child; i < _a.length; i++){
            compileStatement(_a[i]);
        }
        emit(OP_RETURNNULL);
    }
    function compileStatement(ast){
        switch(ast.type){
            case AST_NONE: break;
            case AST_STATEMENTLIST:
                for(var i = 0, _a = ast.child; i < _a.length; i++){
                    compileStatement(_a[i]);
                }
                break;
            case AST_ECHO:
                for(var i = 0, _a = ast.child; i < _a.length; i++){
                    compileExpression(_a[i]);
                    emit(OP_ECHO);
                }
                break;
            case AST_EXPR_LIST:
                compileExpression(ast.child[0]);
                emit(OP_POP);
                break;
            case AST_BREAK:
                var leveln = ast.child[0];
                var target = breakTarget(ast, leveln.type === AST_NONE ? 1 : leveln.val);
                if(target === null){
                    singlePosErr('invalid break statement', ast.pos);
                }
                else {
                    target.val.breaks.push(emit(OP_JMP));
                }
                break;
            case AST_CONTINUE:
                var leveln = ast.child[0];
                var target = continueTarget(ast, leveln.type === AST_NONE ? 1 : leveln.val);
                if(target === null){
                    singlePosErr('invalid continue statement', ast.pos);
                }
                else {
                    target.val.continues.push(emit(OP_JMP));
                }
                break;
            case AST_RETURN:
                if(ast.child[0].type === AST_NONE){
                    emit(OP_RETURNNULL);
                }
                else {
                    compileExpression(ast.child[0]);
                    emit(OP_RETURN);
                }
                break;
            case AST_IF:
                compileExpression(ast.child[0]);
                var line1 = emit(OP_JZ);
                compileStatement(ast.child[1]);
                var line2 = emit(OP_JMP);
                setArg(line1, opa.opCount);
                ast.child[2].type !== AST_NONE && compileStatement(ast.child[2]);
                setArg(line2, opa.opCount);
                break;
            case AST_WHILE:
                ast.val = new LoopInfo(true, true);
                var line1 = opa.opCount;
                compileExpression(ast.child[0]);
                var line2 = emit(OP_JZ);
                compileStatement(ast.child[1]);
                emit(OP_JMP, line1);
                setArg(line2, opa.opCount);
                ast.val.done(opa.opCount, line1);
                break;
            case AST_DO_WHILE:
                ast.val = new LoopInfo(true, true);
                var line1 = opa.opCount;
                compileStatement(ast.child[1]);
                var line2 = opa.opCount;
                compileExpression(ast.child[0]);
                emit(OP_JNZ, line1);
                ast.val.done(opa.opCount, line2);
                break;
            case AST_FOR:
                ast.val = new LoopInfo(true, true);
                compileExpression(ast.child[0]);
                var line1 = opa.opCount;
                compileExpression(ast.child[1]);
                var line2 = emit(OP_JZ);
                compileStatement(ast.child[3]);
                var line3 = opa.opCount;
                compileExpression(ast.child[2]);
                emit(OP_JMP, line1);
                setArg(line2, opa.opCount);
                ast.val.done(opa.opCount, line3);
                break;
        }
    }
    function compileExpression(root){
        switch(root.type){
            case AST_NONE: break;
            case AST_EXPR_LIST:
                for(var i = 0, _a = root.child; i < _a.length; i++){
                    compileExpression(_a[i]);
                    i < _a.length - 1 && emit(OP_POP);
                }
                break;
            case AST_BINARYOP:
                compileExpression(root.child[0]);
                compileExpression(root.child[1]);
                emit(root.val);
                break;
            case AST_UNARYOP:
                compileExpression(root.child[0]);
                emit(root.val);
                break;
            case AST_POSTINC:
                compileExpression(root.child[0]);
                emit(OP_INC);
                compileAssignTop(root.child[0]);
                break;
            case AST_POSTDEC:
                compileExpression(root.child[0]);
                emit(OP_DEC);
                compileAssignTop(root.child[0]);
                break;
            case AST_SUFFIXINC:
                compileExpression(root.child[0]);
                emit(OP_DUP);
                emit(OP_INC);
                compileAssignTop(root.child[0]);
                emit(OP_POP);
                break;
            case AST_SUFFIXDEC:
                compileExpression(root.child[0]);
                emit(OP_DUP);
                emit(OP_DEC);
                compileAssignTop(root.child[0]);
                emit(OP_POP);
                break;
            case AST_CONDITIONALEXPR:
                compileExpression(root.child[0]);
                var line1 = emit(OP_JZ);
                root.child[1].type === AST_NONE ? emit(OP_PUSH, true) : compileExpression(root.child[1]);
                var line2 = emit(OP_JMP);
                setArg(line1, opa.opCount);
                compileExpression(root.child[2]);
                setArg(line2, opa.opCount);
                break;
            case AST_LOGICALOR:
                compileExpression(root.child[0]);
                emit(OP_BOOLCAST);
                var line1 = emit(OP_JNZ);
                compileExpression(root.child[1]);
                emit(OP_BOOLCAST);
                setArg(line1, opa.opCount);
                break;
            case AST_LOGICALAND:
                compileExpression(root.child[0]);
                emit(OP_BOOLCAST);
                var line1 = emit(OP_JZ);
                compileExpression(root.child[1]);
                emit(OP_BOOLCAST);
                setArg(line1, opa.opCount);
                break;
            case AST_ASSIGN:
                if(root.val === null){
                    compileAssign(root.child[0], root.child[1]);
                }
                else {
                    compileExpression(root.child[0]);
                    compileExpression(root.child[1]);
                    emit(root.val);
                    compileAssignTop(root.child[0]);
                }
                break;
            case AST_VARIABLE:
                compileExpression(root.child[0]);
                emit(OP_GETVAR);
                break;
            case AST_PROPERTY:
                compileExpression(root.child[0]);
                compileExpression(root.child[1]);
                emit(OP_GETPROP);
                break;
            case AST_OFFSET:
                compileExpression(root.child[0]);
                if(root.child[1].type === AST_NONE){
                    emit(OP_GETMAXOFFSET);
                }
                else {
                    compileExpression(root.child[1]);
                    emit(OP_GETOFFSET);
                }
                break;
            case AST_FUNCTIONCALL:
                if(root.child[0].type === AST_STRING){
                    for(var i = 0, _a = root.child[1].child; i < _a.length; i++){
                        compileExpression(_a[i]);
                    }
                    emit(OP_INVOKENAME, [root.child[0].val, root.child[1].child.length]);
                }
                else {
                    compileExpression(root.child[0]);
                    for(var i = 0, _a = root.child[1].child; i < _a.length; i++){
                        compileExpression(_a[i]);
                    }
                    emit(OP_INVOKE, root.child[1].child.length);
                }
                break;
            case AST_METHODCALL:
                compileExpression(root.child[0]);
                if(root.child[1].type === AST_STRING){
                    for(var i = 0, _a = root.child[2].child; i < _a.length; i++){
                        compileExpression(_a[i]);
                    }
                    emit(OP_INVOKEMETHODNAME, [root.child[1].val, root.child[2].length]);
                }
                else {
                    compileExpression(root.child[1]);
                    for(var i = 0, _a = root.child[2].child; i < _a.length; i++){
                        compileExpression(_a[i]);
                    }
                    emit(OP_INVOKEMETHOD, root.child[2].length);
                }
                break;
            case AST_LOCAL:
                emit(OP_GETLOCAL, root.val);
                break;
            case AST_ARRAY:
                emit(OP_ARRAY);
                for(var i = 0, _a = root.child; i < _a.length; i++){
                    var item = _a[i];
                    if(item.type === AST_NONE){
                        emit(OP_PUSH, 0);
                        emit(OP_ADDARRAYITEM);
                    }
                    else if(item.type === AST_ARRAYPAIR){
                        compileExpression(item.child[0]);
                        compileExpression(item.child[1]);
                        emit(OP_ADDARRAYPAIR);
                    }
                    else {
                        compileExpression(item);
                        emit(OP_ADDARRAYITEM);
                    }
                }
                break;
            case AST_INTEGER:
            case AST_FLOAT:
            case AST_STRING:
                emit(OP_PUSH, root.val);
                break;
            case AST_STRING_LIST:
                compileStringList(root);
                break;
            case AST_CONST:
                emit(OP_GETCONST, root.val);
                break;
            case AST_ANONYFUNCTION:
                
                break;
        }
    }
    function compileStringList(list){
        var s = '', sc = 0;
        for(var i = 0, _a = list.child; i < _a.length; i++){
            if(_a[i].type === AST_STRING){
                s += _a[i].val;
            }
            else {
                sc++;
                emit(OP_PUSH, s);
                s = '';
                compileExpression(_a[i]);
            }
        }
        if(s !== ''){
            sc++;
            emit(OP_PUSH, s);
        }
        emit(OP_CONCAT, sc);
    }
    function compileAssign(dest, src){
        switch(dest.type){
            case AST_LOCAL:
                compileExpression(src);
                emit(OP_SETLOCAL, dest.val);
                break;
            case AST_VARIABLE:
                compileExpression(dest.child[0]);
                compileExpression(src);
                emit(OP_SETVAR);
                break;
            case AST_PROPERTY:
                compileExpression(dest.child[0]);
                compileExpression(dest.child[1]);
                compileExpression(src);
                emit(OP_SETPROP);
                break;
            case AST_OFFSET:
                compileExpression(dest.child[0]);
                if(dest.child[1].type === AST_NONE){
                    compileExpression(src);
                    emit(OP_SETMAXOFFSET);
                }
                else {
                    compileExpression(dest.child[1]);
                    compileExpression(src);
                    emit(OP_SETOFFSET);
                }
                break;
            case AST_ARRAY:
                compileListAssign(dest, src);
                break;
            default:
                singlePosErr('invalid left hand side value in assignment', dest);
        }
    }
    function compileAssignTop(dest){
        localNode.val = allocateRegister();
        emit(OP_SETLOCAL, localNode.val);
        emit(OP_POP);
        compileAssign(dest, localNode);
        releaseRegister(localNode.val);
    }
    function compileListAssign(list, src){
        if(list.child.length === 0){
            singlePosErr('cannot use empty arrays in assignment', list);
            return;
        }
        compileExpression(src);
        var reg = allocateRegister();
        emit(OP_SETLOCAL, reg);
        emit(OP_POP);
        var keyed = list.child[0].type === AST_ARRAYPAIR;
        for(var i = 0, _a = list.child; i < _a.length; i++){
            var n = _a[i];
            if(n.type === AST_NONE && keyed){
                singlePosErr("cannot use empty array entries in key'd array assignment", n);
                continue;
            }
            if(keyed && n.type !== AST_ARRAYPAIR || !keyed && n.type === AST_ARRAYPAIR){
                singlePosErr("cannot mix key'd and unkey'd elements in array assigment", n);
                continue;
            }
            if(keyed){
                var key = n.child[0];
                var val = n.child[1];
                emit(OP_GETLOCAL, reg);
                compileExpression(key);
                emit(OP_GETOFFSET);
                compileAssignTop(val);
                emit(OP_POP);
            }
            else if(n.type !== AST_NONE){
                emit(OP_GETLOCAL, reg);
                emit(OP_PUSH, i);
                emit(OP_GETOFFSET);
                compileAssignTop(n);
                emit(OP_POP);
            }
        }
        emit(OP_GETLOCAL, reg);
        releaseRegister(reg);
    }
}

exports.compile = function compile(fname, source, errs){
    var parser = createParser();
    var outputs = { astRoot: null };
    var err = false;
    parser.init(outputs);
    parser.on('lexicalerror', function(c, line, column){
        line++;
        column++;
        errs.push('lexical error: (line ' + line + ', column ' + column + '): unexpected character "' + c + '"');
        parser.halt();
        err = true;
    });
    parser.on('syntaxerror', function(msg, token){
        errs.push('syntax error: (line ' + token.startLine + ', column ' + token.startColumn + '):' + msg);
        parser.halt();
        err = true;
    });
    parser.accept(source);
    parser.end();
    if(err){
        return null;
    }
    else {
        var cp = createCompiler(fname);
        cp.addErrHandler(function(msg){
            errs.push(msg);
        });
        return cp.compile(outputs.astRoot);
    }
}

})));