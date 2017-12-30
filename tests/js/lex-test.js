'use strict';
var jslexer = require('./js-lexer.js');
var fs = require('fs');
module.exports = function(){
    var source = fs.readFileSync(process.argv[2],'utf-8');
    // fs.writeFileSync(__dirname + '/dfa.txt',jslexer.dfaTable());
    var matcher = jslexer(source);
    var 好嘛 = 0;
    var o = {};
    o.好嘛 = 0;
    var ret = matcher();
    function line(img,id,space){
        if(space >= img.length){
            return ' '.repeat(space - img.length) + img + ' : ' + id;
        }
        else {
            return img + ' : ' + id;
        }
    }
    while(ret){
        ret.action.id !== jslexer.WHITE_SPACE && console.log(line(ret.matched,ret.action.id,20));
        ret = matcher();
    }
}
