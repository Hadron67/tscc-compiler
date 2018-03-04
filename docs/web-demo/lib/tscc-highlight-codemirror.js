(function(global, factory){
    if(typeof exports === 'object' && typeof module !== 'undefined'){
        module.exports = factory(require('tscc', require('CodeMirror')));
    }
    else if(typeof define === 'function' && define.amd){
        define(['tscc', 'codemirror'], factory);
    }
    else {
        factory(tscc, CodeMirror);
    }
})(this, function(tscc, CodeMirror){ 'use strict';

var TokenType = tscc.highlight.TokenType;
var hc = tscc.highlight.createHighlightContext();
var start = hc.getState();
var eol = '\n'.charCodeAt(0);
var stream = null;

hc.load({
    current: function(){ 
        var c = stream.peek();
        return c !== undefined ? c.charCodeAt(0) : eol;
    },
    next: function(){ stream.next(); },
    isEof: function(){ return false; },
    backup: function(s){ stream.backUp(s.length); }
});

function copyArray(a){
    var ret = [];
    for(var i = 0; i < a.length; i++){
        ret.push(a[i]);
    }
    return ret;
}
function copyState(state){
    return {
        lexState: copyArray(state.lexState),
        lrState: copyArray(state.lrState),
        sematicS: copyArray(state.sematicS)
    };
}
function getTokenClass(cl){
    switch(cl){
        case TokenType.EOF: return '';
        case TokenType.NONE: return '';
        case TokenType.ERROR: return 'error';
        case TokenType.STRING: return 'string';
        case TokenType.NAME: return 'variable-2';
        case TokenType.COMMENT: return 'comment';
        case TokenType.DIRECTIVE: return 'keyword';
        case TokenType.PUNCTUATION: return 'punctuation';
        case TokenType.CODE: return '';
        case TokenType.TOKEN_IN_CODE: return 'keyword';
        default: return '';
    }
}
function scan(stream1, state){
    stream = stream1;
    hc.loadState(state);
    return getTokenClass(hc.nextToken());
}


CodeMirror.defineMode('tscc', function (){
    return {
        startState: function(){ return copyState(start); },
        token: scan,
        copyState: copyState
    }
});
CodeMirror.defineMIME('text/tscc', 'tscc');
    
});
