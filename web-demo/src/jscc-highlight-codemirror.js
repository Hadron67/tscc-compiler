/// <reference path="./jscc.js" />
void function(jscc){
    'use strict';
    var util = jscc.highlightUtil;
    var T = util.T;

    var states = {};

    function tokenKind(t){
        switch(t){
            case T.NAME:
                return "variable";
            case T.STRING:
            case T.REGEXP:
                return "string";
            case T.OPT:
            case T.TOKEN_DIR:
            case T.LEFT_DIR:
            case T.NONASSOC_DIR:
            case T.RIGHT_DIR:
            case T.PREC_DIR:
            case T.STATE_DIR:
                return "keyword";
            case T.BLOCK:
                return "text";
            case T.ARROW:
            case T.EOL:
            case T.OR:
            case T.SEPERATOR: 
                return "punctuation";
            case T.LINE_COMMENT: 
            case T.BLOCK_COMMENT:
                return "comment";
            case T.TOKEN:
                return "tag";
            case T.OPEN_CURLY_BRA:
                return 'bracket';
        }
    }
    var t = new util.Token();
    var opt = { isHighlight: true };
    var scanner = util.scanner({ isHighlight: true });
    var ss = {
        stream: null,
        peek: function(){
            return this.stream.peek() || null;
        },
        next: function(){
            return this.stream.next() || null;
        }
    };

    function tokenBase(stream,state){
        ss.stream = stream;
        scanner.init(ss);
        try {
            scanner.next(t);
            if(t.id === T.OPEN_CURLY_BRA){
                state.ss.push(tokenBlock);
            }
            return tokenKind(t.id);
        }
        catch(e){
            console.log(e.toString());
            return 'error';
        }
    }
    function tokenBlock(stream,state){
        var level = 1;
        while(true){
            var c = stream.peek();
            if(c === '{'){
                level++;
            }
            else if(c === '}'){
                level--;
                if(level <= 0){
                    state.ss.pop();
                    state.ss.push(tokenOutBlock);
                    return 'text';
                }
            }
            if(stream.next() === undefined){
                return 'error';
            }
        }
    }
    function tokenOutBlock(stream,state){
        state.ss.pop();
        stream.next();
        return 'bracket';
    }

    CodeMirror.defineMode("jscc",function(config,parseConfig){

        return {
            startState: function(bc){
                return {
                    tokenize: null,
                    ss: [ tokenBase ]
                };
            },
            token: function(stream,state){
                return state.ss[state.ss.length - 1](stream,state);
            }
        };
    });
    CodeMirror.defineMIME('text/jscc','jscc');
}(jscc);