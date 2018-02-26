import * as io from './util/io';
import { Console } from './util/common';
import { TSCCContext, createContext } from './top/result';
import { generateCode } from './codegen/template';

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
    /** content of grammar file */
    input: string;
    /** name (path) of the output file, if not specified, the output file won't be generated. */
    outputFile?: string;

    // interface
    /** an interface object to print all the messages */
    stdout: io.OutputStream;
    /** a callback used to write file. */
    writeFile(path: string, content: string): any;

    // options
    /** test input. If specified, it will be parsed, and the process will be printed. */
    testInput?: string;
    /** whether to print a detailed list of time costs */
    printDetailedTime?: boolean;
    /** whether to print lexical DFA tables to the output file. */
    printDFA?: boolean;
};

export function main(opt: TSCCOptions): number{
    var stdout = opt.stdout;
    var echo = (s: string | number) => stdout.writeln(s);
    var result = createContext();
    do {
        var startTime = new Date();

        result.compile(opt.input, deleteSuffix(opt.inputFile));
        if(result.hasWarning()){
            result.printWarning(stdout);
        }
        if(result.hasError()){
            result.printError(stdout);
            result.isTerminated() && echo('compilation terminated');
            break;
        }
        if(opt.outputFile){
            var out = new io.StringOS();
            
            result.beginTime('generate output file');
            opt.printDFA && result.printDFA(out);
            result.printTable(out);
            result.endTime();
    
            opt.writeFile(opt.outputFile, out.s);
        }
    
        var current = new io.StringOS();

        result.beginTime('generate parser code');
        result.genCode({
            save: fname => { 
                opt.writeFile(fname, current.s);
                current = new io.StringOS();
            },
            write: s => current.write(s),
            writeln: s => current.writeln(s)
        });
        result.endTime();

        if(opt.testInput){
            echo("preparing for test");
            for(var line of result.testParse(opt.testInput.split(/[ ]+/g), msg => echo(msg))){
                echo(line);
            }
        }

        echo(`compilation done in ${(new Date().valueOf() - startTime.valueOf()) / 1000}s`);

        opt.printDetailedTime && result.printDetailedTime(stdout);
    }while(false);
    echo(result.warningSummary());
    return result.hasError() ? -1 : 0;
}