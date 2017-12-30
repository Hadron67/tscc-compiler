
'use strict';

var fs = require('fs');
var jscc = require('../lib/jscc.js');
var parseArgs = require('./arg.js');

module.exports = function(options){
    try {
        var arg = parseArgs(options);
    }
    catch(e){
        console.log(e.toString());
        console.log('try yapc-js --help for help');
        return -1;
    }

    var input = fs.readFileSync(arg.input,'utf-8');
    try {
        var result = jscc.genResult(jscc.io.StringIS(input));
    }
    catch(e){
        console.log(e.toString());
        return -1;
    }
    var warn = result.warningMsg();
    if(warn !== ''){
        console.log(warn);
    }
    var output = new jscc.io.StringOS();
    result.printTable(output);
    fs.writeFileSync(arg.output,output.s);
    if(arg.test){
        var r = result.testParse(arg.test.split(/[ ]+/g));
        for(var i = 0;i < r.length;i++){
            console.log(r[i]);
        }
    }
    return 0;
}
