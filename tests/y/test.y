%token 'a' 'b'
%left 'a'

%%

start: E;
E: 'a' | 'b';


%%