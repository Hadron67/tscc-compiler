'use strict';
var fs = require('fs');
var Promise = require('bluebird');

function changeSuffix(s, suf){
    var i = s.lastIndexOf('.');
    return (i === -1 ? s : s.substr(0,i)) + suf;
}
function readFile(fn){
    return new Promise(function(accept, reject){
        fs.readFile(fn, function(err, data){
            err ? reject(err) : accept(data.toString());
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
function readDir(dir){
    return new Promise(function(accept, reject){
        fs.readdir(dir, function(err, a){
            err ? reject(err) : accept(a);
        });
    });
}
function compileFile(fname, ext, opt){
    return readFile(fname)
    .then(function(data){
        return writeFile(changeSuffix(fname, ext), compile(data, opt));
    });
}
function compileFiles(dir, inext, outext, opt){
    return readDir(dir)
    .then(function(files){
        var ps = [];
        for(var i = 0; i < files.length; i++){
            files[i].endsWith(inext) && ps.push(compileFile(dir + '/' + files[i], outext, opt));
        }
        return Promise.all(ps);
    });
}
var escapes = {
    '\n': '\\n',
    '\t': '\\t',
    '"': '\\"',
    '\b': '\\b',
    '\f': '\\f'
};
function escape(s){
    for(var from in escapes){
        s = s.replace(new RegExp(from, 'g'), escapes[from]);
    }
    return s;
}
function compile(input, opt){
    opt = opt || {};
    
    var header = opt.header || '';
    var ret = ''
    var echo = opt.echo || 'echo';
    var args = '';
    var tab = opt.tab || '    ';
    var endl = opt.endl || '\n';
    for(var i = 0, _a = opt.args || []; i < _a.length; i++){
        i > 0 && (args += ', ');
        args += _a[i].name + ': ' + _a[i].type;
    }

    function consume(s){
        var i = input.indexOf(s);
        var ret;
        if(i < 0){
            ret = input;
            input = '';
            return ret;
        }
        ret = input.substr(0, i);
        input = input.substring(i + s.length, input.length);
        return ret;
    }
    function eat(regexp){
        while(regexp.test(input[0])){
            input = input.substring(1, input.length);
        }
    }
    function eatOne(regexp){
        regexp.test(input[0]) && (input = input.substring(1, input.length));
    }
    while(input.length > 0){
        ret += echo + '("' + escape(consume('<%')) + '");' + endl;
        if(input.charAt(0) === '-'){
            input = input.substring(1, input.length);
            eat(/[ \n\t]/);
            ret += echo + '(' + consume('%>').trim() + ');' + endl;
            // eatOne(/[\n]/);
        }
        else {
            eat(/[ \n\t]/);
            ret += consume('%>') + endl;
            // eatOne(/[\n]/);
        }
    }
    return [
        header,
        'export default function(' + args + '){',
        ret,
        '}'
    ].join(endl);
}

var endl = '\n';
compileFiles('./src/codegen/templates', 'ets', '.ts', {
    header: [
        `import { TemplateInput, TemplateOutput } from '../def';`,
        `import { Item, Action } from '../../grammar/item-set';`,
        `import { Rule } from '../../grammar/grammar';`,
        `import { TokenDef } from '../../grammar/token-entry';`,
        `import { CodeGenerator } from '../code-generator';`,
        `import { DFA } from '../../lexer/dfa';`,
        `import { LexAction } from '../../lexer/action';`,
        `import { State, Arc } from '../../lexer/state';`,
        `import { Inf } from '../../util/interval-set';`,
        ''
    ].join(endl),
    args: [
        { name: 'input', type: 'TemplateInput' },
        { name: 'output', type: 'TemplateOutput' }
    ]
});