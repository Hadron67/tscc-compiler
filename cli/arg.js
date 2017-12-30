'use strict';

function changeSuffix(s,suf){
    var i = s.lastIndexOf('.');
    return (i === -1 ? s : s.substr(0,i)) + suf;
}

module.exports = function (args){
    function requireArg(msg){
        if(args.length === 0){
            throw new Error(msg);
        }
        else {
            return args.shift();
        }
    }
    var ret = {
        input: null,
        output: null,
        test: null
    };
    while(args.length > 0){
        switch(args[0]){
            case '-o':
            case '--output':
                args.shift();
                ret.output = requireArg('-o(--output) requires one argument');
                break;
            case '-t':
            case '--test':  
                args.shift();
                ret.test = requireArg('-t(--test) requires one argument');
                break;
            default:
                if(ret.input){
                    throw new Error('exactly one file input is required');
                }
                else {
                    ret.input = requireArg();
                }
        }
    }
    if(ret.input === null){
        throw new Error('no input file given');
    }
    ret.output = ret.output || changeSuffix(ret.input,'.output');
    return ret;
}