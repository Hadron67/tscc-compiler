# tscc-compiler
An LALR(1) compiler generator written in typescript. It generates both the tokenizer and the parser.
Currently it can generate parsers written in javascript and typescript. More target languages will be supported in future releases.

## Installation
To use it in node, you can install tscc-compiler via npm:
```shell
npm install tscc-compiler -g
```
Or, to use it in browsers, just download the file ```tscc.js``` or ```tscc.min.js``` and reference them with a script tag. The latter is a compressed version of the former.

## Usage
### From command line interface
To generate the corresponding parser whose grammar is specified in ```test.y```, for example, you could use the following command:
```shell
tscc-compiler test.y
```
The output files actually depends on the target language. For js and ts, ```test.ts``` or ```test.js``` would be generated respectively, plus a report file ```test.output```, which contains the lexical DFA and LALR parse table.
### Options
| Option         | Description| Argument|
|:---------------|:----------|:---------------|
|-o, --output    |specify the output file to print DFA and parse table|name of the output file|
|-t, --test|parse (no lexical analyse) the given input string. Parsing process will be printed|the string to be parsed. See wiki for the format of this string.|
|-h, --help|print help message and quit|no|

## Grammar file
The syntax of the grammar specifying file used by tscc is similiar to yacc. Checkout wiki for tscc-compiler for a specification of grammar file, and [examples](examples) for explicit usages.

## License
MIT.