%lex {
    < IF: '如果' >
    < ELSE: '那么' >
    < WHILE: '当' >
    < FOR: '对于' >

}

%%

start: topstmtlist;
topstmtlist: topstmtlist topstmt | /* empty */;


%%