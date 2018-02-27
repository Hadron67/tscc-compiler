var tscc = require('../../lib/tscc.js');
var TokenType = tscc.highlight.TokenType;
var s = tscc.highlight.highlightString(`
/* hkm */
//soor
%token <a>
%%
S : <a> { $$ = 4; };
%%
`, function(cl){
    switch(cl){
        case TokenType.EOF: return null;
        case TokenType.NONE: return null;
        case TokenType.ERROR: return 'cm-error';
        case TokenType.STRING: return 'cm-string';
        case TokenType.NAME: return 'cm-variable';
        case TokenType.COMMENT: return 'cm-comment';
        case TokenType.DIRECTIVE: return 'cm-keyword';
        case TokenType.PUNCTUATION: return 'cm-punctuation';
        case TokenType.CODE: return null;
        case TokenType.TOKEN_IN_CODE: return 'cm-keyword';
        default: return null;
    }
});
console.log(s);