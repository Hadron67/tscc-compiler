define([
    'exports',
    'jquery'
], function(exports, $) { 'use strict';

function touchStart($this, cb){
    $this.on('mousedown', function(e){ cb(e.pageX, e.pageY); });
    $this.on('touchstart', function(e){
        e.preventDefault();
        var t = e.originalEvent.touches[0];
        cb(t.pageX, t.pageY);
    });
}

function touchMove($this, cb){
    $this.on('mousemove', function(e){ cb(e.pageX, e.pageY); });
    $this.on('touchmove', function(e){
        e.preventDefault();
        var t = e.originalEvent.touches[0];
        cb(t.pageX, t.pageY);
    });
}

function touchEnd($this, cb){
    $this.on('mouseup', cb);
    $this.on('touchend', cb);
}
exports.initResizer = function initResizer($this, $elem1, $elem2, done){
    var lastX, lastY;
    var k;
    touchStart($this, function(pageX, pageY){
        lastX = pageX;
        lastY = pageY;
        touchMove($(document), function(pageX, pageY){
            var delta = pageY - lastY;
            var h1 = $elem1.height();
            var h2 = $elem2.height();
            if(h1 + delta < 10 || h2 - delta < 10){
                return;
            }
            k = (h2 - delta) / (h1 + delta);
            $elem1.css('flex-grow', 1);
            $elem2.css('flex-grow', k);
            lastX = pageX;
            lastY = pageY;
        });
        touchEnd($(document), function(){
            $(document).off('mousemove');
            $(document).off('mouseup');
            $(document).off('touchmove');
            $(document).off('touchend');
            done && done(k);
        });
    });
}


});