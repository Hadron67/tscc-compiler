'use strict';

var jscc = require('../../lib/jscc.js');
var jsccd = jscc.debug;

function ArrayWraper(a,row,column){
    this.a = a;
    this.rows = row;
    this.columns = column;
}
ArrayWraper.prototype.isEmpty = function(row,column){
    return this.a[row * this.columns + column] === 0;
}
ArrayWraper.prototype.emptyCount = function(row){
    var l = this.columns * row;
    var count = 0;
    for(var i = 0;i < this.columns;i++){
        this.a[l + i] === 0 && count++;
    }
    return count;
}
ArrayWraper.prototype.dp = function(dps){
    function leftAlign(s,sp){
        return s.length > sp ? s : s + ' '.repeat(sp - s.length);
    }
    var ret = '';
    for(var i = 0;i < this.rows;i++){
        ret += '   '.repeat(dps[i]);
        var l = this.columns * i;
        for(var j = 0;j < this.columns;j++){
            ret += leftAlign(this.a[l + j].toString(),3);
        }
        ret += '\n';
    }
    return ret;
}

function disp(dp){
    var min = 0;
    var ret = new Array(dp.length);
    for(var i = 0;i < dp.length;i++){
        dp[i] < min && (min = dp[i]);
    }
    for(var i = 0;i < dp.length;i++){
        ret[i] = dp[i] - min;
    }
    return ret;
}

module.exports = function(){
    jscc.setDebugger(console);
    var ar = new ArrayWraper(
        [1,0,1,0,0,0,0,1,
         1,0,0,1,0,1,0,0,
         1,0,0,1,1,0,1,1,
         0,0,0,1,5,1,1,0,
         0,0,1,0,0,0,0,0,
         0,0,0,0,1,0,0,0],6,8
    );
    var comped = jsccd.compress(ar);
    console.log('len: %s',comped.len);
    console.log(ar.dp(disp(comped.dps)));
}