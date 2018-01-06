%lex [
    BLOCK = < ([^'%', '>'] | '%'[^'>'] | '>')* >
    < TEXT: ([^'<', '%'] | '<'[^'%'] | '%')+ >
    < CODE: "<%" <BLOCK> "%>" >
    < EXPR: "<%-" <BLOCK> "%>" >
]

%%

start: items;
items: items item|;
item: <TEXT> | <CODE> | <EXPR>;

%%