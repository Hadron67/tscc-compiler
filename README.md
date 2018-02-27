# tscc-compiler
An LALR(1) compiler generator written in typescript. It generates both the tokenizer and the parser.
Currently it can generate parsers written in javascript and typescript. More target languages will be supported in future releases.

Check out [wiki](https://github.com/Hadron67/tscc-compiler/wiki) for tscc-compiler!

## Installation
To use it in node, you can install tscc-compiler via npm:
```shell
npm install tscc-compiler -g
```
Or, to use it in browsers, just download the file `tscc.js` or `tscc.min.js` and reference them with a script tag. The latter is a compressed version of the former.

## Usage
### From command line interface (CLI)
To generate the corresponding parser whose grammar is specified in `test.y`, for example, you could use the following command:
```shell
tscc-compiler test.y
```
The output files actually depends on the target language. For js and ts, `test.ts` or `test.js` would be generated respectively, plus a report file `test.output`, which contains the lexical DFA tables and LALR parse table.
### Options for CLI
| Option         | Description| Argument|
|:---------------|:----------|:---------------|
|-o, --output    |Specify the output file to print DFA and parse table|Name of the output file|
|-t, --test|Parse (no lexical analyse) the given input string. Parsing process will be printed. See below for explanation.|The string to be parsed.|
|-d, --detail-time|Print a detailed list of time costs of different generation phases.|No|
|-h, --help|Print help message and quit|No|
### From module
This project uses module bundler `rollup` to create a source file `tscc.js` that contains the entail source code for tscc-compiler. You may import it as a module by `var tscc = require('tscc-compiler');` or include `tscc.js` with a script tag in browsers. A simple way to invoke tscc-compiler is calling `tscc.main` with the argument being an object that contains various options. It returns `0` if no error ocurrs, otherwise it returns `-1`. Options are listed below:

|Option |Required|Type|Description|
|:------|:-------|:---|:----------|
|inputFile|Yes|`string`|Name of the input file|
|input|Yes|`string`|Content of the input file|
|outputFile|No|`string`|Name of output file (not to be confused with output parser). If not specified, the output file won't be generated.|
|stdout|Yes|`tscc.io.OutputStream`|An interface object to output all the messages. This object must contain `write(s)` and `writeln(s)`.|
|writeFile|Yes|`(path: string, content: string) => any`|A callback to write files.|
|testInput|No|`string`|Test input. If specified, the result will be printed. See below for explanation.|
|printDetailedTime|Yes|`boolean`|Whether to print the detailed time cost list.|
|printDFA|No|`boolean`|Whether to print lexical DFA tables in the output file.|
|showlah|No|`boolean`|Whether to show look-ahead tokens of items when printing parse table.|
|showFullItemsets|No|`boolean`|Whether to show full item sets when printing parse table. If not specified or set to `false`, only kernel items will be printed.|

Where type notations in Typescript are used.

Here's a simple example:
```js
var fs = require('fs');
var tscc = require('tscc-compiler').main;
tscc({
    inputFile: 'example.y',
    input: fs.readFileSync('example.y', 'utf-8'),
    outputFile: 'example.output',
    stdout: {
    	write: function(s){ process.stdout.write(s); },
        writeln: function(s){ console.log(s || ''); }
    },
    writeFile: function(path, content){
        fs.writeFileSync(path, content);
    },
    printDetailedTime: true
});
```
The module also provides a more flexible way to use it. 

### Test input
You can give the tscc-compiler a test input string to test if the grammar works. Input string consists of the following two elements, seperated by spaces:
- An identifier parenthesised by `<>` is a token, referenced by its name;
- A raw string is also a token, but referenced by alias;

For example, to test the calculator grammar (see `examples/calculator/`):
```shell
tscc-compiler caculator.y -t "<CONST> + <CONST> * <CONST>"
```
The output should be:
```text
preparing for test
| <CONST> "+" <CONST> "*" <CONST> 
<CONST> | "+" <CONST> "*" <CONST> 
expr | "+" <CONST> "*" <CONST> 
expr "+" | <CONST> "*" <CONST> 
expr "+" <CONST> | "*" <CONST> 
expr "+" expr | "*" <CONST> 
expr "+" expr "*" | <CONST> 
expr "+" expr "*" <CONST> | 
expr "+" expr "*" expr | 
expr "+" expr | 
expr | 
start | 
accepted!
compilation done in 0.071s
0 warning(s), 0 error(s)
```

## Grammar file
The syntax of the grammar specifying file used by tscc is similiar to yacc. Checkout [wiki](https://github.com/Hadron67/tscc-compiler/wiki) for tscc-compiler for a specification of grammar file, and [examples/](https://github.com/Hadron67/tscc-compiler/tree/master/examples) for explicit usages.

## Syntax highlight
A syntax highlight mode of grammar file for CodeMirror can be found at `web-demo/src/tscc-highlight-codemirror.js`. Feel free to check it out and use it.

## License
MIT.
