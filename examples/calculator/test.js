var calc = require('./calculator.js');

var parser = new calc.Parser();
parser.on('lexicalerror', function(msg){
    console.log(msg);
});
parser.on('syntaxerror', function(msg){
    console.log(msg);
});
parser.on('accept', function(){
    console.log('result: ' + parser.val);
});
parser.on('token', function(tk, val){
    console.log(`token <${tk}>(${val}) found`);
});

parser.accept('1');
parser.end();