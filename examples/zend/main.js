'use strict';
var zend = require('./zend_language_parser.js');
var fs = require('fs');

var source = fs.readFileSync(process.argv[2], 'utf-8');
var err = [];
zend.compile(source, err);
if(err.length > 0){
    err.forEach(function(e){
        console.log(e);
    });
}
else {
    console.log('compilation done.');
}