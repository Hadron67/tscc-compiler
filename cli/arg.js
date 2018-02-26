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
        test: null,
        help: false,
        detailedTime: false,
        dfa: false
    };
    out:
    while(args.length > 0){
        switch(args[0]){
            case '-h':
            case '--help':
                args.shift();
                ret.help = true;
                break;
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
            case '-d':
            case '--detail-time':
                args.shift();
                ret.detailedTime = true;
                break;
            case '--dfa':
                args.shift();
                ret.dfa = true;
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
    if(!ret.help) {
        if(ret.input === null){
            throw new Error('no input file given');
        }
        ret.output = ret.output || changeSuffix(ret.input,'.output');
    }
    return ret;
}