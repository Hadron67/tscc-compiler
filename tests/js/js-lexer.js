'use strict';
var jscc = require('../../lib/jscc.js');

jscc.setDebugger(console);

exports = module.exports = function(s){
    return dfa.matcher(jscc.io.StringIS(s));
}
exports.WHITE_SPACE = 0;

var dfa = jscc.Pattern.lexer((function(defs){
    var i = 0;
    return function(){
        if(i < defs.length){
            return { regexp: defs[i++],id: i };
        }
        else if(i === defs.length){
            i++;
            exports.WHITE_SPACE = defs.length;
            return { regexp: '[ \t\n\r]+',id: defs.length };
        }
        else {
            return null;
        }
    }
})([
    // regular expression literals are not implemented, since grammar is required to do that
    '{NAME}({NAME}|{DIGIT})*',
    '[0-9]+(\\.[0-9]*)?|[0-9]*\\.[0-9]+',
    '([0-9]+(\\.[0-9]*)?|[0-9]*\\.[0-9]+)[eE][\\+\\-]?[0-9]+',
    '//[^\n]*',
    '/\\*([^\\*/]|\\*[^/]|[^\\*]/)*\\*/',
    '"([^"\n]|\\\\")*"',
    '\'([^\'\n]|\\\\\')*\'',
    '\\.{NAME}({NAME}|{DIGIT})*',
    'var',
    'if',
    'else',
    'while',
    'do',
    'for',
    'function',
    'return',
    'throw',
    'switch',
    'case',
    'default',
    'break',
    'continue',
    'class',
    'import',
    'export',
    '=>',
    '\\(',
    '\\)',
    '\\{',
    '\\}',
    '\\[',
    '\\]',
    ',',';',':','\\?',
    '=','+=','-=','\\*=','%=','/=','&=','\\|=','\\^=','>>=','<<=',
    '\\+','-','\\*','/','%','&','|','\\^','>>','<<','in',
    '&&','\\|\\|','!',
    '\\+\\+','\\-\\-',
    'new','delete','void','typeof',
    '>','<','>=','<=','==','===','!=','!==','instanceof',
]),{ 
    'NAME': {
        val:
        '[\\x0024' + 
        '\\x0041-\\x005A' + 
        '\\x005f' + 
        '\\x0061-\\x007a' + 
        '\\x00c0-\\x00d6' + 
        '\\x00d8-\\x00f6' + 
        '\\x00f8-\\x00ff' + 
        '\\x0100-\\x1fff' + 
        '\\x3040-\\x318f' + 
        '\\x3300-\\x337f' + 
        '\\x3400-\\x3d2d' + 
        '\\x4e00-\\x9fff' + 
        '\\xf900-\\xfaff]',
    }
    'DIGIT': {
        val:
        '[\\x0030-\\x0039' + 
        '\\x0660-\\x0669' +
        '\\x06f0-\\x06f9' + 
        '\\x0966-\\x096f' +
        '\\x09e6-\\x09ef' +
        '\\x0a66-\\x0a6f' +
        '\\x0ae6-\\x0aef' +
        '\\x0b66-\\x0b6f' + 
        '\\x0be7-\\x0bef' +
        '\\x0c66-\\x0c6f' +
        '\\x0ce6-\\x0cef' +
        '\\x0d66-\\x0d6f' +
        '\\x0e50-\\x0e59' +
        '\\x0ed0-\\x0ed9' +
        '\\x1040-\\x1049]',
    }
});
exports.dfaTable = function(){
    return dfa.toString();
}
