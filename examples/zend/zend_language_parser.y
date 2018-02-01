%header {
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.zend = {})));
}(this, (function (exports) \{ 'use strict';

function ZNode(type, child, val, pos){
    this.type = type;
    this.val = val || null;
    this.child = typeof child === 'array' ? child : typeof child === 'undefined' ? [] : [child];
    this.pos = pos || null;
}
ZNode.NONE = new ZNode(AST_NONE);
ZNode.prototype.add = function(c){
    this.child.push(c);
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
var escapes = {
    'n': '\n',
    'f': '\f',
    'b': '\b',
    'r': '\r',
    't': '\t',
    '\\': '\\',
    '"': '"',
    "'": "'"
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
var cc = 0;
var OP_NOP = cc++;
var OP_PUSH = cc++;
var OP_POP = cc++;
var OP_GETVAR = cc++;
var OP_SETVAR = cc++;
var OP_SETPROP = cc++;
var OP_GETPROP = cc++;
var OP_GETOFFSET = cc++;
var OP_SETOFFSET = cc++;

var OP_PLUS = cc++;
var OP_MINUS = cc++;
var OP_TIMES = cc++;
var OP_DIVIDE = cc++;
var OP_POW = cc++;
var OP_MOD = cc++;
var OP_BITAND = cc++;
var OP_BITOR = cc++;
var OP_BITXOR = cc++;
var OP_BITNOT = cc++;
var OP_AND = cc++;
var OP_OR = cc++;
var OP_NOT = cc++;
var OP_XOR = cc++;
var OP_LEFTSHIFT = cc++;
var OP_RIGHTSHIFT = cc++;
var OP_POSITIVE = cc++;
var OP_NEGATIVE = cc++;
var OP_INC = cc++;
var OP_DEC = cc++;
var OP_GREATERTHAN = cc++;
var OP_LESSTHAN = cc++;
var OP_EQUAL = cc++;
var OP_IDENTICAL = cc++;
var OP_GREATERTHANOREQUAL = cc++;
var OP_LESSTHANOREQUAL = cc++;
var OP_NOTEQUAL = cc++;
var OP_NOTIDENTICAL = cc++;

var OP_CALL = cc++;
var OP_NEW = cc++;
var OP_DEFINEFUNCTION = cc++;

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
var AST_FUNCCALL = cc++;

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
var AST_ARRAY = cc++;
var AST_ARRAYPAIR = cc++;

}

%output "javascript"

%lex {
    NEWLINE = < "\n"|"\r"|"\r\n" >

    < INLINE_HTML: [^'<']+ | '<' [^]* >: { $$ = nodeFromToken($token); }
    < %lease "<?php" ([" ", "\t"]|<NEWLINE>) >: [='', +IN_SCRIPTING]
    < ECHO_TAG: %lease "<?=" >: [+IN_SCRIPTING]
}

%lex <IN_SCRIPTING> {
    LABEL = < ['a'-'z', 'A'-'Z', '\x80'-'\xff']['a'-'z', 'A'-'Z', '0'-'9', '\x80'-'\xff']* >
    NUM = < ['0'-'9'] >
    HEX = < ['a'-'f', 'A'-'F', '0'-'9'] >
    TAB_AND_SPACE = < ["\t", " "]+ >
    WHITESPACE = < ( <TAB_AND_SPACE> | <NEWLINE> )+ >
    ESCAPE_CHAR = < "\\" ( ['n', 'r', 'f', 'b', 't', '\\', '"', "'"] | ['u', 'x'] <HEX>+ ) >

    < <WHITESPACE> >: [='']
    < '?>' >: [='', -]

    < NAME: <LABEL> >: { $$ = nodeFromToken($token); }
    < DECIMAL: ( <NUM>+ ('.' <NUM>*)? | '.' <NUM>+ ) (['e', 'E']['+', '-']?<NUM>+)? >
    : { $$ = nodeFromToken($token); $$.val = Number($$.val); }
    < INT: <NUM>+ >: { $$ = nodeFromToken($token); $$.val = Number($$.val); }
    < STRING: "'" ( [^"'", "\n", "\\"] | <ESCAPE_CHAR> )* "'"  >
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

    < HEREDOC_HEADER: '<<<' >
    < ARROW: '=>' >
    < PROPERTY_ARROW: '->' >
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
    < FUNCTION: 'function' >
    < LIST: 'list' >
    < USE: 'use' >
}

%lex <LOOKING_FOR_PROPERTY> {
    < <WHITESPACE> >: [='']

    < NAME: <LABEL> >: { $$ = nodeFromToken($token); }
    < DOLLAR: '$' >
    < BBRA: '{' >
    < VARIABLE: '$' <LABEL> >: { $$ = nodeFromToken($token); $$.val = $$.val.substr(1, $$.val.length - 1); }
}

%lex <IN_DOUBLE_QUOTE> {
    < ANY_CONTENT: [^"$", '"']+ | "$" [^"$", '"']* >
    < DOUBLE_QUOTE: '"' >
}

%lex <IN_HEREDOC> {

}

%lex <IN_DOUBLE_QUOTE, IN_HEREDOC> {
    < VARIABLE_IN_STRING: "$" <LABEL> >
    < PROPERTY_IN_STRING: "$" <LABEL> '->' <LABEL> >
    < OFFSET_IN_STRING: "$" <LABEL> "[" >
}

%token <END_OF_HEREDOC>

%right 'else'

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
%left '+' '-'
%left '*' '/' '%'
%right '**'
%left UNARY

%extra_arg {
    var outputs;
}

%init {outputs1}{
    outputs = outputs1;
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
|   expr ';'
|   h = <INLINE_HTML> { h.type = AST_STRING; $$ = new ZNode(AST_ECHO, h); }
|   <ECHO_TAG> e = expr <INLINE_HTML> { $$ = new ZNode(AST_ECHO, e); }
|   'echo' e = expr ';' { $$ = new ZNode(AST_ECHO, e); }
|   if_statement
|   'while' '(' cond = expr ')' s = statement { $$ = new ZNode(AST_WHILE, [cond, s]); }
|   'do' s = statement 'while' '(' cond = expr ')' ';' 
    { $$ = new ZNode(AST_DO_WHILE, [cond, s]); }
|   'for' '(' e1 = for_exprs ';' e2 = for_exprs ';' e3 = for_exprs ')' s = statement
    { $$ = new ZNode(AST_FOR, [e1, e2, e3, s]); }
;

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
;

var:
    callable_variable
|   v = dereferencable [+LOOKING_FOR_PROPERTY] '->' [-] pn = property_name
    { $$ = new ZNode(AST_PROPERTY, [v, pn]); }
;
callable_variable:
    simple_var
|   v = dereferencable '[' e = optional_expr ']' 
    { $$ = new ZNode(AST_OFFSET, [v, e]); }
;
simple_var: 
    v = <VARIABLE> { v.type = AST_STRING; $$ = new ZNode(AST_VARIABLE, v); }
|   '$' '{' e = expr '}' { $$ = new ZNode(AST_VARIABLE, e); }
|   '$' v = simple_var { $$ = new ZNode(AST_VARIABLE, v); }
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
    <NAME> '(' argument_list ')'
|   callable_expr '(' argument_list ')'
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
    a = var '=' b = expr 
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

|   a = expr '>' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_GREATERTHAN); }
|   a = expr '<' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_LESSTHAN); }
|   a = expr '>=' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_GREATERTHANOREQUAL); }
|   a = expr '<=' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_LESSTHANOREQUAL); }
|   a = expr '==' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_EQUAL); }
|   a = expr '===' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_IDENTICAL); }
|   a = expr '!=' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_NOTEQUAL); }
|   a = expr '!==' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_NOTIDENTICAL); }

|   a = expr '^' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_BITXOR); }
|   a = expr '|' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_BITOR); }
|   a = expr '&' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_BITAND); }
|   a = expr '>>' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_RIGHTSHIFT); }
|   a = expr '<<' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_LEFTSHIFT); }

|   a = expr '&&' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_AND); }
|   a = expr '||' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_OR); }

|   a = expr 'OR' b = expr { $$ = new ZNode(AST_LOGICALOR, [a, b]); }
|   a = expr 'XOR' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_XOR); }
|   a = expr 'AND' b = expr { $$ = new ZNode(AST_LOGICALAND, [a, b]); }

|   a = expr '+' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_PLUS); }
|   a = expr '-' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_MINUS); }
|   a = expr '*' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_TIMES); }
|   a = expr '/' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_DIVIDE); }
|   a = expr '%' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_MOD); }
|   a = expr '**' b = expr { $$ = new ZNode(AST_BINARYOP, [a, b], OP_POW); }
|   '(' a = expr ')' { $$ = a; }
|   '+' a = expr %prec UNARY { $$ = new ZNode(AST_UNARYOP, a, OP_POSITIVE); }
|   '-' a = expr %prec UNARY { $$ = new ZNode(AST_UNARYOP, a, OP_NEGATIVE); }
|   '!' a = expr { $$ = new ZNode(AST_UNARYOP, a, OP_NOT); }
|   '~' a = expr { $$ = new ZNode(AST_UNARYOP, a, OP_BITNOT); }
|   '++' a = var { $$ = new ZNode(AST_POSTINC, a); }
|   '--' a = var { $$ = new ZNode(AST_POSTDEC, a); }
|   a = var '++' { $$ = new ZNode(AST_SUFFIXINC, a); }
|   a = var '--' { $$ = new ZNode(AST_SUFFIXDEC, a); }
|   primitive
|   'function' '(' l = parameter_list ')' lexical_vars '{' b = statement_list '}'
|   function_call
;

function_declaration_statement:
    'function' n = <NAME> '(' l = parameter_list ')' '{' b = statement_list '}'
    { $$ = vm.emitFunction(n, l, b); }
;
parameter_list:
    /* empty */ { $$ = new ZNode(AST_PARAMLIST); }
|   non_empty_parameter_list
;
non_empty_parameter_list:
    non_empty_parameter_list ',' p = parameter { $$.add(p); }
|   p = parameter { $$ = new ZNode(AST_PARAMLIST, p); }
;
parameter: p = <NAME> { p.type = AST_STRING; $$ = p; };

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
|   s = <STRING> { s.type = AST_STRING; $$ = s; }
|   s = <NAME> { s.type = AST_CONST; $$ = s; }
|   '[' a = array_pair_list ']' { $$ = a; }
|   'list' '(' a = array_pair_list ')' { $$ = a; }
;

array_pair_list: non_empty_array_pair_list | /* empty */ { $$ = new ZNode(AST_ARRAY); };
non_empty_array_pair_list:
    non_empty_array_pair_list ',' a = array_pair { $$.add(a); }
|   a = array_pair { $$ = new ZNode(AST_ARRAY, a); }
;
array_pair:
    expr
|   a = expr '=>' b = expr { $$ = new ZNode(AST_ARRAYPAIR, [a, b]); }
;
%%

exports.compile = function compile(source, errs){
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
        return outputs.astRoot;
    }
}

})));