
'use strict';

var fs = require('fs');
var jscc = require('../lib/jscc.js');
var parseArgs = require('./arg.js');

function stream(st){
    return {
        write: function(s){
            st.write(s);
        },
        writeln: function(s){
            s && st.write(s);
            st.write('\n');
        }
    }
}

function pass(a){
    return new Promise(function(acc){
        acc(a);
    });
}

function main(options){
    jscc.setDebugger(console);
    var consoleStream = stream(process.stdout);
    try {
        var arg = parseArgs(options);
    }
    catch(e){
        console.log(e.toString());
        console.log('try yapc-js --help for help');
        process.exit(-1);
    }

    var input = fs.readFileSync(arg.input,'utf-8');
    var result = jscc.genResult(jscc.io.StringIS(input));
    if(result.hasError()){
        result.printError(consoleStream);
        return pass(result);
    }
    if(result.hasWarning()){
        result.printWarning(consoleStream);
    }

    if(arg.test){
        var r = result.testParse(arg.test.split(/[ ]+/g));
        for(var i = 0;i < r.length;i++){
            console.log(r[i]);
        }
    }

    // no console output from now on
    var output = fs.createWriteStream(arg.output);
    output.cork();
    result.printTable(stream(output));
    output.uncork();
    output.close();
    return new Promise(function(acc, rej){
        output.on('close', function(){
            acc(result);
        });
    });
}

module.exports = function(options){
    options.shift();
    options.shift();
    return main(options)
    .then(function(result){
        console.log(result.warningSummary());    
        return result.hasError() ? -1 : 0;
    });
}
