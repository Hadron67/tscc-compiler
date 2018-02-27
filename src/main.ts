import * as io from './util/io';
import { Console } from './util/common';
import { TSCCContext, createContext } from './top/result';
import { generateCode } from './codegen/template';

export { highlight } from './parser/parser';
export { Assoc } from './grammar/token-entry';
export { setDebugger } from './util/common';
export { defineTemplate } from './codegen/template';
export { io, createContext, generateCode };
export var version = '1.0.2';

// debug
import * as debug from './debug';
export { debug };

function changeSuffix(s: string, suf: string): string{
    var i = s.lastIndexOf('.');
    return (i === -1 ? s : s.substr(0,i)) + suf;
}
function deleteSuffix(s: string): string{
    var i = s.lastIndexOf('.');
    return i === -1 ? s : s.substr(0,i);
}

export interface TSCCOptions{
    /** name (path) of the input grammar file. */
    inputFile: string;
    /** content of grammar file, */
    input: string;
    /**
     * name (path) of the output file, if set to `null` or `undefined`, the output file won't be generated.
     * @default undefined
     */
    outputFile?: string;

    // interface
    /** an interface object to print all the messages, */
    stdout: io.OutputStream;
    /** a callback used to write file. */
    writeFile(path: string, content: string): any;

    // options
    /** 
     * test input. If specified, it will be parsed, and the process will be printed.
     * @default null
     */
    testInput?: string;
    /**
     * whether to print a detailed list of time costs.
     * @default false
     */
    printDetailedTime?: boolean;
    /**
     * whether to print lexical DFA tables to the output file.
     * @default false
     */
    printDFA?: boolean;
    /**
     * whether to show look-ahead tokens of items when printing parse table.
     * @default false
     */
    showlah?: boolean;
    /**
     * whether to show full item sets when printing parse table. Only kernel 
     * items will be printed when set to `false`
     * @default false
     */
    showFullItemsets?: boolean;
};

export function main(opt: TSCCOptions): number{
    var stdout = opt.stdout;
    var echo = (s: string | number) => stdout.writeln(s);
    var ctx = createContext();
    do {
        var startTime = new Date();

        ctx.compile(opt.input, deleteSuffix(opt.inputFile));
        if(ctx.hasWarning()){
            ctx.printWarning(stdout);
        }
        if(ctx.hasError()){
            ctx.printError(stdout);
            ctx.isTerminated() && echo('compilation terminated');
            break;
        }
        if(opt.outputFile){
            var out = new io.StringOS();
            
            ctx.beginTime('generate output file');
            opt.printDFA && ctx.printDFA(out);
            ctx.printTable(out, opt.showlah, opt.showFullItemsets);
            ctx.endTime();
    
            opt.writeFile(opt.outputFile, out.s);
        }
    
        var current = new io.StringOS();

        ctx.beginTime('generate parser code');
        ctx.genCode({
            save: fname => { 
                opt.writeFile(fname, current.s);
                current = new io.StringOS();
            },
            write: s => current.write(s),
            writeln: s => current.writeln(s)
        });
        ctx.endTime();

        if(opt.testInput){
            echo("preparing for test");
            for(var line of ctx.testParse(opt.testInput.split(/[ ]+/g), msg => echo(msg))){
                echo(line);
            }
        }

        echo(`compilation done in ${(new Date().valueOf() - startTime.valueOf()) / 1000}s`);

        opt.printDetailedTime && ctx.printDetailedTime(stdout);
    }while(false);
    echo(ctx.warningSummary());
    return ctx.hasError() ? -1 : 0;
}