
%lex [
    HEX = < ['0'-'9', 'a'-'f', 'A'-'F'] >
    ESCAPE_CHAR = < "\\" (['n', 't', '"', "'", "\\"] | <UNICODE>) >
    UNICODE = < ['x', 'u'] <HEX> ( <HEX> )?  >

    < ["\n", "\t", " ", "\r"]+ >
    < "/*" ([^"*", "/"]|[^"*"]"/"|"*"[^"/"])* "*/" >
    < "//" [^"\n"]* >

    < TEST: '"' ([^"\n", '"', '\\'] | <ESCAPE_CHAR>)* '"' >
    < HKM: 'hkm' >
]


%%

start: t = <TEST> m = <TEST> block;
block: %use(t, m) a = 'hkm' [-] b = <TEST> {} c = <TEST>;


%%