'use strict';

var jsccd = require('../../lib/tscc.js').debug;


module.exports = function(){
    var its = new jsccd.IntervalSet({
        createData: function(){ return[]; },
        union: function(dest, src){
            for(var i = 0; i < src.length; i++){
                dest.push(src[i]);
            }
        },
        stringify: function(a){
            return '(' + a.join(',') + ')';
        }
    });
    
    its.add(0,10,['a']);
    console.log(its.toString());
    
    its.add(10,10,['b']);
    console.log(its.toString());
    
    its.add(5,20,['c']);
    console.log(its.toString());
}