var calc = require('./calculator.js');

var r = calc(process.argv[2]);
r !== null && console.log(r);