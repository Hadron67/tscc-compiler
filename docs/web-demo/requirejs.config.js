// immitates 'rollup.config.js'
requirejs.config({
    paths: {
        jquery: 'lib/jquery',
        tscc: 'lib/tscc',
        codemirror: 'lib/codemirror'
    }
});
// entry point
requirejs(['src/app.js']);