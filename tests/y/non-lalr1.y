/*
    This grammar is LR(1),but not LALR(1). It is the well-known example that
    LR(1) grammar cannot be handled by LALR(1) parsers.

    The reason for this is that LR(1) parser generator will generate numbers of
    item sets including these two (see non-lalr1.output):

    state 7
        [ 5: A => <c> ., { <d> } ]*
        [ 6: B => <c> ., { <e> } ]*
        default action: reduce with rule 5
        <e> : reduce with rule 6

    state 10
        [ 5: A => <c> ., { <e> } ]*
        [ 6: B => <c> ., { <d> } ]*
        default action: reduce with rule 5
        <d> : reduce with rule 6

    Since they have identical kernel items, LALR(1) would merge them, producing 
    a reduce/reduce conflict.

    But Honalee algorithm won't merge item sets if merging them would produce
    reduce/reduce conflicts, so it can handle a wilder class of grammars, including
    this one. 

*/
%token <a> <b> <c> <d> <e>

%%

S : <a> A <d>;
S : <a> B <e>;
S : <b> A <e>;
S : <b> B <d>;
A : <c>;
B : <c>;

%%