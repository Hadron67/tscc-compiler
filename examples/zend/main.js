'use strict';
var zend = require('./jzend_parser.js');
var fs = require('fs');

var source = fs.readFileSync(process.argv[2], 'utf-8');
var err = [];
var opcode = zend.compile(process.argv[2], source, err);
if(err.length > 0){
    err.forEach(function(e){
        console.log(e);
    });
}
else {
    // console.log('compilation done.');
    // console.log(opcode.dump().join('\n'));

    var vm = zend.createVM();
    vm.defineFunction('getTestObject', function(){
        var ret = {};
        ret.__zendProps = { test: 'hkm' };
        ret.__zendProto = {
            print: function(args, acc){
                acc('aewgwgegwe');
            },
            setProp: function(args, acc){
                this.__zendProps.test = args[0] || 0;
            }
        };
        return ret;
    });
    vm.defineInterface({
        out: function(s){ process.stdout.write(s); },
        stdout: function(s){ process.stdout.write(s); }
    });
    vm.createFunctionFromOpArray(opcode)(function(s){});
}