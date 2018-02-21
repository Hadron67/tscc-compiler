import * as io from './util/io';
import { Console } from './util/common';
import { genResult, Result } from './top/result';
import { generateCode } from './codegen/template';

export { setDebugger, setTab } from './util/common';
export { defineTemplate } from './codegen/template';
export { io, genResult, generateCode };

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
    /**
     * file name (path) of the grammar file
     */
    inputFile: string;
    /**
     * content of the input grammar file
     */
    input: string;
    /**
     * name (path) of the output file, if not present, the output file won't be generated
     */
    outputFile?: string;

    // interface
    stdout: io.OutputStream;
    writeFile(path: string, content: string): any;

    // options
    testInput?: string;
    printDetailedTime: boolean;
};

export function main(opt: TSCCOptions){
    var stdout = opt.stdout;
    var echo = (s: string | number) => stdout.writeln(s);
    var result: Result = null;
    do {
        var startTime = new Date();

        result = genResult(opt.input, deleteSuffix(opt.inputFile));
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
            result.printDFA(out);
            result.printTable(out);
            result.endTime();
    
            opt.writeFile(opt.outputFile, out.s);
        }
    
        var templateIn = result.getTemplateInput();
        var current = new io.StringOS();

        result.beginTime('generate parser code');
        generateCode(templateIn.output, templateIn, {
            save: fname => opt.writeFile(fname, current.s),
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