'use strict';

var fs = require('fs');
// var Promise = require('bluebird');
var jscc = require('../lib/jscc.js');
var parseArgs = require('./arg.js');
var pkg = require('../package.json');

var help = 
`usage: ${pkg.name} [options] file
   or  ${pkg.name} --help|-h

options:
    -o, --output  Specify output file;
    -t, --test    Run test on the given input string;
    -h, --help    Print this help message and exit.
`;
function changeSuffix(s,suf){
    var i = s.lastIndexOf('.');
    return (i === -1 ? s : s.substr(0,i)) + suf;
}

function stream(st){
    return {
        write: function(s){
            st.write(s);
        },
        writeln: function(s){
            s && (st.write(s) || console.assert(false));
            st.write('\n');
        }
    }
}

function pass(a){
    return new Promise(function(acc){
        acc(a);
    });
}

function readFile(fname){
    return new Promise(function(accept, reject){
        fs.readFile(fname, function(err, data){
            err ? reject(err) : accept(data.toString('utf-8'));
        });
    });
}

function writeFile(fname, data){
    return new Promise(function(accept, reject){
        fs.writeFile(fname, data, function(err){
            err ? reject(err) : accept();
        });
    });
}

function genCode(result, arg){
    var tempIn = result.getTemplateInput();
    var files = [];
    var current = new jscc.io.StringOS();
    jscc.generateCode('typescript', tempIn, {
        save: function(ext){
            files.push(writeFile(changeSuffix(arg.input, ext), current.s));
            current.reset();
        },
        write: function(s){
            current.write(s);
        },
        writeln: function(s){
            current.writeln(s);
        }
    }, function(err){
        err ? reject(err) : accept();
    });
    return Promise.all(files);
}

function generate(arg){
    jscc.setDebugger(console);
    var consoleStream = stream(process.stdout);
    
    if(arg.help){
        console.log(help);
        process.exit(0);
    }

    // var input = fs.readFileSync(arg.input,'utf-8');
    return readFile(arg.input)
    .then(function(input){
        var result = jscc.genResult(input);
        if(result.hasWarning()){
            result.printWarning(consoleStream);
        }
        if(result.hasError()){
            result.printError(consoleStream);
            result.terminated && console.log('compilation terminated');
            return pass(result);
        }
    
        // no console output from now on
        var out = new jscc.io.StringOS();
        result.printDFA(out);
        result.printTable(out);
        return writeFile(arg.output, out.s)
        .then(function(){
            return genCode(result, arg);
        })
        .then(function(){
            return result;
        });
    });
}

function main(arg){
    return generate(arg)
    .then(function(result){
        console.log(result.warningSummary());
        if(arg.test){
            console.log("preparing for test");
            var r = result.testParse(arg.test.split(/[ ]+/g));
            for(var i = 0;i < r.length;i++){
                console.log(r[i]);
            }
        }
    });
}

module.exports = function(options){
    options.shift();
    options.shift();
    try {
        var arg = parseArgs(options);
    }
    catch(e){
        console.log(e.toString());
        console.log(`try "${pkg.name} --help" for help`);
        return pass(-1);
    }
    return main(arg)
    .catch(function(e){
        console.log(e.toString());
    });
}
