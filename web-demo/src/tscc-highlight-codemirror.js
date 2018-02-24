void function(CodeMirror){
    'use strict';
    var stringPattern = /"([^"\n\r]|\\([nrbf"]|[uUxX][0-9a-fA-F]+))*"|'([^'\n\r]|\\([nrbf']|[uUxX][0-9a-fA-F]+))*'/;
    var idPattern = /[a-zA-Z$_][a-zA-Z0-9$_]*/;
    CodeMirror.defineMode('tscc', {
        start: [
            { regexp: /%(left|right|nonassoc|option|token|output|import|least)/, token: 'keyword' },
            { regexp: stringPattern, token: 'string' },
            { regexp: idPattern, token: 'variable' }
        ],
        block: [],
        actionBlock: [],
        comment: []
    });
}(CodeMirror);