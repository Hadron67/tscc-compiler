define([
    'jquery', 
    'codemirror', 
    'tscc', 
    'src/footer-panel',
    
    'lib/tscc-highlight-codemirror',
], function($, CodeMirror, tscc, footer){ 'use strict';

function AnimatedHide(elem, steps, dt, cla){
    this.elem = elem;
    this.soored = false;
    this.dt = dt;
    this.steps = steps;
    this.cla = cla;
}
AnimatedHide.prototype.hide = function(){
    if(!this.soored){
        this.soored = true;
        var ceci = this;
        var i = 0;
        var height = this.elem.height();
        var dh = height / this.steps;
        var interval = setInterval(function(){
            ceci.elem.height(height - dh * i++);
            if(i >= ceci.steps){
                clearInterval(interval);
                ceci.elem.height(height);
                ceci.soored = false;
                ceci.elem.addClass(ceci.cla);
            }
        }, this.dt);
    }
}
AnimatedHide.prototype.show = function(){
    if(!this.soored){
        this.soored = true;
        this.elem.removeClass(this.cla);
        var ceci = this;
        var i = 0;
        var height = this.elem.height();
        var dh = height / this.steps;
        this.elem.height(0);
        var interval = setInterval(function(){
            ceci.elem.height(dh * i++);
            if(i >= ceci.steps){
                clearInterval(interval);
                ceci.elem.height(height);
                ceci.soored = false;
            }
        }, this.dt);
    }
}
AnimatedHide.prototype.toggle = function(){
    if(!this.soored){
        if(this.elem.hasClass(this.cla)){
            this.show();
        }
        else {
            this.hide();
        }
    }
}
$('.toggle-btn').click(function(){
    var $t = $($(this).attr('data-target'));
    $t.is(':hidden') ? $t.fadeIn() : $t.fadeOut();
});
$('.close-btn').click(function(){
    $($(this).attr('data-target')).fadeOut();
});
$('.dropdown').each(function(){
    var ceci = new AnimatedHide($($(this).attr('data-dropdown')), 15, 20, 'hidden');
    $(this).click(function(){
        if(!ceci.soored){
            if(ceci.elem.hasClass('hidden')){
                ceci.show();
                $(document).on('click', function(){
                    if(!ceci.soored){
                        ceci.hide();
                        $(document).off('click');
                    }
                });

                return false;
            }
        }
    });
});
$('.collapse-btn').each(function(){
    var soored = false;
    var ceci = new AnimatedHide($($(this).attr('data-collapse')), 10, 20, 'collapsed');
    $(this).click(function(){
        ceci.toggle();
    });
});


var demoCode = {};

function dedent(text, indent){
    var lines = text.split('\n');
    for(var i = 0; i < lines.length; i++){
        var line = lines[i];
        lines[i] = lines[i].substr(indent * 4, line.length - indent * 4);
    }
    return lines.join('\n');
}
function loadHintCode(){
    var $s = $('#tscc-hint');
    return dedent($s.text(), Number($s.attr('data-indent')));
}
$('.tscc-demo-script').each(function(){
    var fname = $(this).attr('data-fname');
    demoCode[fname] = dedent($(this).text(), Number($(this).attr('data-indent')));
    $('#demo-files').append('<li><a href="javascript:void(0);" class="menu-btn demo-file-btn">' + fname + '</a></li>');
});
$('.demo-file-btn').click(function(){
    editor.setValue(demoCode[$(this).text()]);
});
var editor = CodeMirror($('#editor-container')[0], {
    lineNumbers: true,
    value: loadHintCode(),
    mode: 'tscc'
});
var escapes = {
    '>': '&gt;',
    '<': '&lt;',
    ' ': '&nbsp;',
    '\n': '<br />',
    '\t': '&nbsp;&nbsp;&nbsp;&nbsp;',
    '&': '&amp;'
};
var ctx = tscc.createContext();
ctx.setEscape(escapes);

function escapeHTML(s){
    var ret = '';
    for(var i = 0; i < s.length; i++){
        var c = s.charAt(i);
        ret += escapes[c] || c;
    }
    return ret;
}
function checkDone(){
    if(!ctx.isDone()){
        footer.message('Compilation not done. Please press "Compile" first.<br />');
        footer.fadeIn('messages');
        return false;
    }
    else {
        return true;
    }
}

$('#btn-compile').click(function(){
    ctx.compile(editor.getValue(), 'test.y');
    var os = new tscc.io.StringOS();
    os.endl = '<br />';
    if(ctx.hasWarning()){
        ctx.printWarning(os);
    }
    if(ctx.hasError()){
        ctx.printError(os);
        ctx.isTerminated() && os.writeln('compilation terminated');
    }
    else {
        os.writeln('input accepted');
    }
    footer.message(os.s);
    footer.fadeIn('messages');
});
$('#btn-run').click(function(){
    if(checkDone()){
        var code = '';
        ctx.genCode({
            save: function(){},
            write: function(s){ code += s; },
            writeln: function(s){ code += s + '\n'; },
        });
        try {
            var func = new Function('console', 'input', code);
            func({
                log: function(s){ footer.output(escapeHTML(s) + '<br />'); }
            }, $('#parse-input').val());
            footer.fadeIn('output');
        }
        catch(e){
            footer.message('Error occurs while executing the code: ' + escapeHTML(e.toString()) + '<br />');
            footer.fadeIn('messages');
        }
    }
});
$('#btn-parse-table').click(function(){
    if(checkDone()){
        var os = new tscc.io.StringOS();
        os.endl = '<br />';
        ctx.printTable(os, false, false);
        footer.output(os.s);
        footer.fadeIn('output');
    }
});
$('#btn-full-table').click(function(){
    if(checkDone()){
        var os = new tscc.io.StringOS();
        os.endl = '<br />';
        ctx.printTable(os, false, true);
        footer.output(os.s);
        footer.fadeIn('output');
    }
});
$('#btn-dfa-tables').click(function(){
    if(checkDone()){
        var os = new tscc.io.StringOS();
        os.endl = '<br />';
        ctx.printDFA(os);
        footer.output(os.s);
        footer.fadeIn('output');
    }
});

});