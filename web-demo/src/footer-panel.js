define([
    'exports',
    'jquery',
    'src/resizer'
], function(exports, $, resizer) { 'use strict';

function components(a, btn){
    return {
        show: function(){
            for(var i = 0; i < a.length; i++){
                a[i].show();
            }
            btn.addClass('footer-button-active');
        },
        hide: function(){
            for(var i = 0; i < a.length; i++){
                a[i].hide();
            }
            btn.removeClass('footer-button-active');
        }
    };
}
var panels = {
    'messages': components(
        [$('#message-panel'), $('.btn-clear-msg')], 
        $('.fbtn-messages')
    ),
    'output': components(
        [$('#output-panel'), $('.btn-clear-output')], 
        $('.fbtn-output')
    ),
    'input': components(
        [$('#input-panel')],
        $('.fbtn-input')
    )
};

function close(){
    $('.footer-panel').hide();
    for(var which in panels){
        panels[which].hide();
    }
}
function fadeOut(){
    var grow = Number($('.footer-panel').css('flex-grow'));
    var editorHeight = $('.editor-container').height();
    var panelHeight = $('.footer-panel').height();
    var steps = 30;
    var dh = panelHeight / steps;
    var i = 0;
    var interval = setInterval(function(){
        panelHeight -= dh;
        editorHeight += dh;
        $('.footer-panel').css('flex-grow', panelHeight / editorHeight);
        i++;
        if(i >= steps){
            clearInterval(interval);
            close();
            $('.footer-panel').css('flex-grow', grow);
        }
    }, 10);
}
// XXX: not working as intended
function fadeIn(which){
    if($('.footer-panel').is(':hidden')){
        show(which);
        var grow = Number($('.footer-panel').css('flex-grow'));
        var editorHeight = $('.editor-container').height();
        var panelHeight = $('.footer-panel').height();
        $('.footer-panel').css('flex-grow', 0);
        var steps = 20;
        var dh = panelHeight / steps;
        var i = 0;
        editorHeight += panelHeight;
        panelHeight = 0;
        var interval = setInterval(function(){
            panelHeight += dh;
            editorHeight -= dh;
            $('.footer-panel').css('flex-grow', panelHeight / editorHeight);
            i++;
            if(i >= steps){
                clearInterval(interval);
                $('.footer-panel').css('flex-grow', grow);
            }
        }, 10);
    }
    else {
        show(which);
    }
}
function show(which){
    $('.footer-panel').show();
    for(var w in panels){
        panels[w].hide();
    }
    panels[which].show();
}

$('.footer-button').click(function(){
    if($(this).hasClass('footer-button-active')){
        fadeOut();
    }
    else {
        fadeIn($(this).attr('data-show'));
    }
});
$('.btn-close').click(function(){
    fadeOut();
});
$('.btn-clear-msg').click(function(){
    $('#message-content').html('');
});
$('.btn-clear-output').click(function(){
    $('#output-content').html('');
});

resizer.initResizer($('#footer-resizer'), $('#editor-container'), $('#footer-panel'));

exports.show = show;
exports.fadeIn = fadeIn;
exports.message = function(s){
    $('#message-content').append(s);
}
exports.output = function(s){
    $('#output-content').append(s);
}

});