'use strict';
var jsccd = require('../../lib/tscc.js').debug;
var IntervalSet = jsccd.IntervalSet;
var createClassFinder = jsccd.createClassFinder;

module.exports = function(){
    var it1 = new IntervalSet();
    it1.add(0, 10);
    it1.add(20, 40);
    
    var it2 = new IntervalSet();
    it2.add(0, 50);
    // it2.add(35, 50);

    var it3 = new IntervalSet();
    it3.add(15, 25);
    
    var f = createClassFinder();
    f.addClass(it1);
    f.addClass(it2);
    f.addClass(it3);
    var c = f.done();
    
    console.log(c.classSet.toString());
}