void function(tscc, CodeMirror){
    'use strict';
    var TokenType = tscc.highlight.TokenType;
    var hc = tscc.highlight.createHighlightContext();
    var start = hc.getState();
    var eol = '\n'.charCodeAt(0);
    var stream = null;
    var eof = false;
    var err = false;
    function current(){
        var ret = stream.next();
        if(ret === undefined){
            return null;
        }
        else {
            stream.backUp(1);
            return ret.charCodeAt(0);
        }
    }
    hc.load({
        current: current,
        next: function(){ stream.next(); },
        isEof: function(){ return current() === null; },
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
        eof = false;
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
    CodeMirror.defineMIME('');
    CodeMirror.defineMode('test', function(){
        return {
            startState: function(){ return null; },
            token: function(s, state){
                var c ;
                console.log('start');
                do {
                    console.log(s.peek());
                } while((c = s.next()) !== undefined);
                return '';
            }
        };
    });
    
}(tscc, CodeMirror);