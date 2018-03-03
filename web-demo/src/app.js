define([
    'jquery', 
    'codemirror', 
    'tscc', 
    'src/footer-panel',
    
    'lib/tscc-highlight-codemirror',
], function($, CodeMirror, tscc, footer){ 'use strict';

$('.dropdown').click(function(){
    var $dropdown = $($(this).attr('data-dropdown'));
    $dropdown.toggle();
});
var demoCode = {};
$('.tscc-demo-script').each(function(){
    var fname = $(this).attr('data-fname');
    demoCode[fname] = dedent($(this).text(), $(this).attr('data-indent'));
    $('#demo-files').append('<a href="javascript:void(0);" class="demo-file-btn">' + fname + '</a>');
});
$('.demo-file-btn').click(function(){
    editor.setValue(demoCode[$(this).text()]);
});
function dedent(text, indent){
    var lines = text.split('\n');
    for(var i = 0; i < lines.length; i++){
        var line = lines[i];
        lines[i] = lines[i].substr(indent * 4, line.length - indent * 4);
    }
    return lines.join('\n');
}
var editor = CodeMirror($('#editor-container')[0], {
    lineNumbers: true,
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
$('.collapse-btn').click(function(){
    var $t = $($(this).attr('data-collapse'));
    var interval, height = $t.height();
    var i = 0, steps = 10;
    var dh = height / steps;
    if($t.hasClass('collapsed')){
        $t.removeClass('collapsed');
        $t.height(0);        
        interval = setInterval(function(){
            $t.height(dh * i++);
            if(i >= steps){
                clearInterval(interval);
                $t.height(height);
            }
        }, 20);
    }
    else {
        interval = setInterval(function(){
            $t.height(dh * (steps - i++));
            if(i >= steps){
                clearInterval(interval);
                $t.height(height);
                $t.addClass('collapsed');
            }
        }, 20);
    }
});

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
    if(ctx.isDone()){
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
    else {
        footer.message('Compilation not done. Please press "Compile" first.<br />');
        footer.fadeIn('messages');
    }
});

});