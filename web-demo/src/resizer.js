define([
    'exports',
    'jquery'
], function(exports, $) { 'use strict';

function touchStart($this){
    
}

exports.initResizer = function initResizer($this, $elem1, $elem2, done){
    var lastX, lastY;
    var k;
    $this.on('mousedown', function(e){
        lastX = e.pageX;
        lastY = e.pageY;
        $(document).on('mousemove', function(e){
            var delta = e.pageY - lastY;
            var h1 = $elem1.height();
            var h2 = $elem2.height();
            if(h1 + delta < 10 || h2 - delta < 10){
                return;
            }
            k = (h2 - delta) / (h1 + delta);
            $elem1.css('flex-grow', 1);
            $elem2.css('flex-grow', k);
            lastX = e.pageX;
            lastY = e.pageY;
        });
        $(document).on('mouseup', function(){
            $(document).off('mouseup');
            $(document).off('mousemove');
            done && done(k);
        });
    });
}


});