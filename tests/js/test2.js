'use strict';

var jsccd = require('../../lib/jscc.js').debug;

function SimpleArray(){
    this.d = [];
}
SimpleArray.prototype.add = function(d){
    this.d.push(d);
}
SimpleArray.prototype.union = function(a){
    for(var i = 0;i < a.d.length;i++){
        this.d.push(a.d[i]);
    }
}
SimpleArray.prototype.toString = function(){
    var ret = '';
    if(this.d.length === 0){
        return '';
    }
    for(var i = 0;i < this.d.length;i++){
        i > 0 && (ret += ',');
        ret += this.d[i].toString();
    }
    return '(' + ret + ')';
}

module.exports = function(){
    var its = new jsccd.IntervalSet(function(){
        return new SimpleArray();
    });
    
    its.add(0,10,'a');
    console.log(its.toString());
    
    its.add(10,10,'b');
    console.log(its.toString());
    
    its.add(5,20,'c');
    console.log(its.toString());
}