'use strict';

var fs = require('fs');
//var Promise = require('bluebird');
var tscc = require('../lib/tscc.js').main;
var parseArgs = require('./arg.js');
var pkg = require('../package.json');

var help = 
`usage: ${pkg.name} [options] file
   or  ${pkg.name} --help|-h

options:
    -o, --output       Specify output file;
    -t, --test         Run test on the given input string;
    -d, --detail-time  Print the time costs of different phases;
    -h, --help         Print this help message and exit.
`;

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

function main(arg){
    var stdout = {
        write: function(s){
            process.stdout.write(s);
        },
        writeln: function(s){
            console.log(s || '');
        }
    }
    var files = [];
    return readFile(arg.input)
    .then(function(input){
        var status = tscc({
            inputFile: arg.input,
            input: input,
            outputFile: arg.output,
            stdout: stdout,
            writeFile: function(path, content){
                files.push(writeFile(path, content));
            },
            testInput: arg.test,
            printDetailedTime: arg.detailedTime,
            printDFA: arg.dfa,
            showlah: arg.showlah,
            showFullItemsets: arg.showFullItemsets
        });
        return Promise.all(files)
        .then(function(){
            return status;
        });
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
        process.exit(-1);
    }
    if(arg.help){
        console.log(help);
        process.exit(0);
    }
    return main(arg)
    .then(function(status){
        process.exit(status);
    })
    .catch(function(e){
        console.log(e.toString());
        process.exit(-1);
    });
}
