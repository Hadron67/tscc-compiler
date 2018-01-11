var calc = require('./calculator.js');

var parser = new calc.Parser();
parser.on('lexicalerror', function(msg){
    console.log(msg);
    parser.halt();
});
parser.on('syntaxerror', function(msg){
    console.log('syntax error: ' + msg);
    parser.halt();
});
parser.on('accept', function(){
    console.log('result: ' + parser.val);
});
// parser.on('token', function(tk, val){
//     console.log(`token <${tk}>("${val}") found`);
// });

parser.accept(process.argv[2]);
parser.end();