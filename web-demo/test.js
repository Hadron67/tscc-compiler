
'use strict';
var e = process.argv;
e.shift();
e.shift();
var jscc = require('./src/jscc.js');
jscc.setDebugger(console);
var s = jscc.Pattern.compile(jscc.ss(e[0]));
s.removeEpsilons();
console.log(s.toString(true));