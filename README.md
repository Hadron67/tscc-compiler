# tscc-compiler
An LALR(1) compiler generator written in typescript. It generates both the tokenizer and the parser.
Currently it can generate parsers for javascript and typescript. More target languages will be supported in future releases.

## installation
```shell
npm install tscc-compiler -g
```

## Usage
### From command line interface
To generate the corresponding parser whose grammar is specified in ```test.y```, for example, you could use the following command:
```shell
tscc-compiler test.y
```
The output files actually depends on the target language. For js and ts, ```test.ts``` or ```test.js``` would be generated respectively, plus a report file ```test.output```, which contains the lexical DFA and LALR parse table.

## Grammar file
The syntax of the grammar specifying file used by tscc is similiar to yacc. Structure of the file is
```
[options] '%%' [grammar rules] '%%' [footer]
```
