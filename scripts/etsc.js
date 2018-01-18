'use strict';
var fs = require('fs');
// var Promise = require('bluebird');

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
var escapes = [
    { from: /\\/g, to: '\\\\'},
    { from: /\n/g, to: '\\n' },
    { from: /\t/g, to: '\\t'},
    { from: /"/g, to: '\\"'},
//    { from: /\b/g, to: '\\b'},
//    { from: /\f/g, to: '\\f'},
];
function escape(s){
    // for(var from in escapes){
    //     s = s.replace(new RegExp(from, 'g'), escapes[from]);
    // }
    escapes.forEach(function(r){
        s = s.replace(r.from, r.to);
    });
    return s;
}
function compile(input, opt){
    opt = opt || {};
    
    var header = opt.header || '';
    var ret = [];
    var echo = opt.echo || 'echo';
    var echoLine = opt.echoLine || 'echoLine';
    var args = '';
    var tab = opt.tab || '    ';
    var endl = opt.endl || '\n';
    var eatingLine = false;
    var T = {
        EXPR: 1,
        CODE: 2,
        TEXT: 3,
        LINE: 4
    };
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
    function emitLine(){
        eatingLine ? (eatingLine = false) : ret.push({ s: '', type: T.LINE });
    }
    function emit(s, type){
        if(type === T.TEXT){
            if(s !== ''){
                var _a = s.split(endl);
                for(var i = 0; i < _a.length; i++){
                    i > 0 && emitLine();
                    _a[i] !== '' && ret.push({s: _a[i], type: T.TEXT});
                }
            }
        }
        else {
            type === T.CODE && eatLine();
            ret.push({ s: s, type: type });
        }
    }
    function eat(regexp){
        while(regexp.test(input[0])){
            input = input.substring(1, input.length);
        }
    }
    function eatOne(s){
        input.indexOf(s) === 0 && (input = input.substring(1, input.length));
    }
    function eatLine(){
        var top = ret[ret.length - 1];
        if(top !== undefined){
            while(top.type === T.TEXT && /^[ ]*$/.test(top.s)){ 
                ret.pop(); 
                top = ret[ret.length - 1]; 
            }
            top.type === T.LINE && ret.pop();
        }
        else {
            eatingLine = true;
        }
        // top ? top.type === T.LINE && ret.pop() : (eatingLine = true);
    }
    while(input.length > 0){
        emit(consume('<%'), T.TEXT);
        if(input.charAt(0) === '-'){
            input = input.substring(1, input.length);
            eat(/[ \n\t]/);
            var s = consume('%>');
            emit(s, T.EXPR);
        }
        else {
            eat(/[ \n\t]/);
            var s = consume('%>');
            if(s.charAt(s.length - 1) === '-'){
                s = s.substr(0, s.length - 1);
                eatOne(endl);
            }
            emit(s, T.CODE);
        }
    }
    var genc = '';
    for(var i = 0; i < ret.length; i++){
        switch(ret[i].type){
            case T.CODE: genc += tab + ret[i].s + endl; break;
            case T.EXPR: genc += tab + echo + '(' + ret[i].s + ');' + endl; break;
            case T.LINE: genc += tab + echoLine + '("");' + endl; break;
            case T.TEXT: 
                if(ret[i + 1] && ret[i + 1].type === T.LINE){
                    genc += tab + echoLine + '("' + escape(ret[i].s) + '");' + endl; 
                    i++;
                }
                else {
                    genc += tab + echo + '("' + escape(ret[i].s) + '");' + endl; 
                }
                break;
        }
    }
    return [
        header,
        'export default function(' + args + '){',
        genc,
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
        `import { oo, _oo } from '../../util/interval-set';`,
        `import { JNode } from '../../parser/node'`,
        ''
    ].join(endl),
    args: [
        { name: 'input', type: 'TemplateInput' },
        { name: 'output', type: 'TemplateOutput' }
    ]
});