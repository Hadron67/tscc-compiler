%token 'id' 'string' 'num' 'true' 'false' 'null'
%token '[' ']' '{' '}' ',' ':'

%%

json: primitives | '[' array ']' | '{' obj '}';

primitives: 'id' | 'string' | 'num' | 'true' | 'false' | 'null';

array: nearray comma | /* empty */;
nearray: nearray ',' json | json;

obj: neobj comma | /* empty */;
neobj: neobj ','oitem | oitem;
oitem: key ':' json;
key: 'id' | 'string';

comma: ',' | /* empty */;

%%