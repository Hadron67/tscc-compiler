
%lex [
    HEX = < ['0'-'9', 'a'-'f', 'A'-'F'] >
    ESCAPE_CHAR = < "\\" (['n', 't', '"', "'", "\\"] | <UNICODE>) >
    UNICODE = < ['x', 'u'] <HEX> ( <HEX> )?  >

    < ["\n", "\t", " ", "\r"]+ >
    < "/*" ([^"*", "/"]|[^"*"]"/"|"*"[^"/"])* "*/" >
    < "//" [^"\n"]* >

    < TEST: '"' ([^"\n", '"', '\\'] | <ESCAPE_CHAR>)* '"' >
    < HKM: 'hkm' >
    < OPEN_BLOCK: '{' >
    < CLOSE_BLOCK: '}' >
]

%lex <IN_BLOCK> [
    < ANY_CODE: [^'{', '}']* >
    < OPEN_BLOCK: '{' >
    < CLOSE_BLOCK: '}' >
]


%%

start: block;
block: v1 = <TEST> v2 = <TEST> v3 = <TEST> {} <TEST>  {  };


%%