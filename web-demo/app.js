var $ = function(){
    'use strict';
    //region funcs
    function $(i){
        return new A(document.getElementById(i));
    }
    function A(el){
        this.el = el;
    }
    A.prototype = {
        constructor: A,
        on: function(e,cb){
            this.el.addEventListener(e,cb);
            return this;
        },
        click: function(cb){
            return this.on('click',cb);
        },
        html: function(h){
            this.el.innerHTML = h;
            return this;
        },
        append: function(h){
            this.el.innerHTML += h;
            return this;
        },
        val: function(v){
            if(v === undefined){
                return this.el.value;
            }
            this.el.value = v;
            return this;
        },
        enable: function(){
            this.el.disabled = false;
            return this;
        },
        disable: function(){
            this.el.disabled = true;
            return this;
        }
    };

    $.ajax = function(arg){
        var a = new XMLHttpRequest();
        a.open(arg.method || 'GET',arg.url,true);
        a.responseType = arg.type || 'text';
        a.addEventListener('readystatechange',function(){
            if(a.readyState === XMLHttpRequest.DONE){
                if(a.status === 200){
                    arg.success && arg.success(a.responseText);
                }
                else {
                    throw new Error(arg.url,' responsed with status ' + a.status);
                }
            }
        });
        a.send(arg.data || null);
    }
    $.cookie = function(){

    }
    
    function require(path,cb){
        var module = { exports:{} };
        var exports = module.exports;
        $.ajax({
            url: path,
            success: function(text){
                eval(text);
                cb(module.exports);
            }
        });
    }
    //endregion

    var $input = $('text1');
    var $result = $('result');
    var $testInput = $('test-input');
    var file = $('source').el;

    var editor = CodeMirror.fromTextArea($input.el,{
        lineNumbers: true,
        mode: 'tscc'
    });

    function echo(s){
        $result.append(s.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br/>') + '<br/>');
    }
    function clear(){
        $result.html('');
    }
    var stream = new jscc.io.sos();

    jscc.setDebugger({
        log: function(s){
            $result.append(s.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br/>') + '<br/>');
        }
    });

    jscc.setTab('&nbsp;&nbsp;&nbsp;&nbsp;');
    var parsed = null;

    $('btn-parse').click(function(){
        clear();
        try{
            parsed = jscc.genResult(new jscc.io.StringIS(editor.getValue()));
            echo('grammar accepted.');
        }
        catch(e){
            var errmsg = e.toString().replace(/</g,'&lt').replace(/>/g,'&gt');
            $result.html(e.toString({ typeClass: 'err-font',escape: true }));
        }
    });
    $('btn-item-sets').click(function(){
        clear();
        if(parsed !== null){
            stream.reset();
            parsed.printItemSets(stream);
            echo(stream.s);
        }
        else {
            echo('grammar not present,please input and press "parse" first.');
        }
    });
    $('btn-parse-table').click(function(){
        clear();
        if(parsed !== null){
            var w = parsed.warningMsg()
            if(w !== ''){
                echo(w);
            }
            stream.reset();
            parsed.printTable(stream);
            echo(stream.s);
        }
        else {
            echo('grammar not present,please input and press "parse" first.');
        }
    });
    $('btn-load').click(function(){
        if(file.files[0]){
            $.ajax({
                url: window.URL.createObjectURL(file.files[0]),
                success: function(s){
                    editor.setValue(s);
                }
            });
        }
    });
    var interval = null;
    var tinput = '';
    $('btn-test').click(function(){
        if(interval !== null){
            clearInterval(interval);
            interval = null;
            $testInput.enable();
            $testInput.val(tinput);
            return;
        }
        if(parsed !== null){
            tinput = $testInput.val();
            var tresult = null;
            try{
                tresult = parsed.testParse(tinput.trim().split(/[ ]+/g));
                $testInput.disable();
                $testInput.val(tresult[0]);
                tresult.shift();
                interval = setInterval(function(){
                    if(tresult.length > 0){
                        $testInput.val(tresult[0]);
                        tresult.shift();
                    }
                    else {
                        clearInterval(interval);
                        interval = null;
                        $testInput.enable();
                        $testInput.val(tinput);
                    }
                },1000);
            }
            catch(e){
                clear();
                $result.html(e.toString({ typeClass: 'err-font',escape: true }));
            }
        }
        else {
            clear();            
            echo('grammar not present,please input and press "parse" first.');
        }
    });

    return $;
}();
