# tscc-compiler
LALR(1) 分析器生成器。生成包括词法分析器和语法分析器。
目前支持生成typescript和javascript。在之后的版本中将会支持更多的语言。

## 安装
```shell
npm install tscc-compiler -g
```

## 用法
### 使用命令行
比如需要生成的分析器的文法描述文件是```test.y```，可以使用一下命令：
```shell
tscc-compiler test.y
```
The output files actually depends on the target language. For js and ts, ```test.ts``` or ```test.js``` would be generated respectively, plus a report file ```test.output```, which contains the lexical DFA and LALR parse table.

## Grammar file
The syntax of the grammar specifying file used by tscc is similiar to yacc. Structure of the file is
```
[options] '%%' [grammar rules] '%%' [footer]
```
