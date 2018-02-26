%token <a> <b> <c> <d> <e>

%%

S : <a> A <d>;
S : <a> B <e>;
S : <b> A <e>;
S : <b> B <d>;
A : <c>;
B : <c>;

%%