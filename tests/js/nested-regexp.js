'use strict';
var jscc = require('../../lib/jscc.js');

module.exports = function(){
    var dfa = jscc.Pattern.lexer([
        { regexp: '{NAME}({NAME}|{DIGIT})*',id: 1 }
    ],{ 'NAME': 
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
        'DIGIT':
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
        test: 'AAA' });
    
    console.log(dfa.toString());
}