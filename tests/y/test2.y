%lex [
    < STRING: "rtrth" >
    < PLUS: "+" >
]

%%

basicRE: ept primitiveRE '+';
primitiveRE: 
    <STRING>
;
ept:;

%%