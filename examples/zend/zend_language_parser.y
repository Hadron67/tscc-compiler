%header {
function nodeFromToken(t){
    return {
        val: t.val,
        ext: null,
        startLine: t.startLine,
        startColumn: t.startColumn,
        endLine: t.endLine,
        endColumn: t.endColumn
    };
}
function nodeFromTrivalToken(t){
    return {
        val: null,
        ext: null,
        startLine: t.startLine,
        startColumn: t.startColumn,
        endLine: t.endLine,
        endColumn: t.endColumn
    };
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

}

%output "javascript"

%lex {
    NEWLINE = < "\n"|"\r"|"\r\n" >

    < INLINE_HTML: "<"? [^"<"]* >: { $$ = nodeFromToken($token); }
    < OPEN_TAG: "<?php" ([" ", "\t"]|<NEWLINE>) >
    < OPEN_TAG_WITH_ECHO: "<?=" >
}

%lex <IN_SCIPTING> {
    LABEL = < ['a'-'z', 'A'-'Z', '\x80'-'\xff']['a'-'z', 'A'-'Z', '0'-'9', '\x80'-'\xff']* >
    NUM = < ['0', '9']+ >

    < NAME: <LABEL> >: { $$ = nodeFromToken($token); }
    < INT: <NUM>+ >
    < DECIMAL: ( <NUM>+ '.' <NUM>* | '.' <NUM>+ ) (['e', 'E']['+', '-']?<NUM>+)? >
    < CLOSE_TAG: '?>' >

}