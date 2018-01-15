import { genItemSets,genParseTable, Conflict } from '../grammar/ptable-gen';
// import { parseSource } from '../parser/gparser';
import { lexer } from '../lexer/pattern';
import { testParse as testParse2 } from './parse-test';
import { YYTAB } from '../util/common';
import { File } from '../parser/file';
import { ItemSet } from '../grammar/item-set';
import { ParseTable, IParseTable, printParseTable } from '../grammar/ptable';
import { TokenDef } from '../grammar/token-entry';
import { NtDef } from '../grammar/grammar';
import { List } from '../util/list';
import { OutputStream, InputStream, StringIS, endl } from '../util/io';
import { Context } from '../util/context';
import { JsccError, JsccWarning, Option } from '../util/E';
import { CompressedPTable } from '../grammar/ptable-compress';
import { TemplateInput } from '../codegen/def';
import { parse } from '../parser/parser';
import { templateExists, listTemplates } from '../codegen/template';
import { markPosition } from '../parser/node';

export interface Result extends Context{
    warn(w: JsccWarning);
    err(e: JsccError);
    printItemSets(stream: OutputStream);
    printTable (os: OutputStream);
    printDFA(os: OutputStream);
    testParse(tokens: string[]): string[];
    printError(os: OutputStream, opt: Option);
    printWarning(os: OutputStream, opt: Option);
    hasWarning(): boolean;
    hasError(): boolean;
    warningSummary();
    getTemplateInput(): TemplateInput;
    isTerminated(): boolean;
}
export function genResult(source: string, fname: string): Result{
    let file: File;
    let itemSets: List<ItemSet>;
    let iterationCount: number;
    let parseTable: CompressedPTable;

    let errors: JsccError[] = [];
    let warnings: JsccError[] = [];
    let needLinecbs: ((ctx: Context, lines: string[]) => any)[] = [];
    let terminated = false;

    let ret: Result = {
        warn,
        err,
        printItemSets,
        printTable,
        printDFA,
        testParse,
        printError,
        printWarning,
        hasWarning,
        hasError,
        warningSummary,
        getTemplateInput,
        requireLines: cb => needLinecbs.push(cb),
        isTerminated: () => terminated
    };

    var f = parse(ret, source);
    let lines = source.split('\n');
    for(let cb of needLinecbs){
        cb(ret, lines);
    }
    if(hasError()){
        terminated = true;
        return ret;
    }
    f.name = fname;
    var g = f.grammar;
    file = f;
    // we still could have error here
    for(var s of g.tokens){
        if(!s.used){
            let msg = `token <${s.sym}> is never used, definations are(is):` + endl;
            for(let pos of s.appears){
                msg += markPosition(pos, lines);
            }
            warn(new JsccWarning(msg));
        }
    }
    for(var s2 of g.nts){
        if(!s2.used){
            warn(new JsccWarning(`non terminal "${s2.sym}" is unreachable`));
        }
    }
    if(!templateExists(f.output.val)){
        let msg = `template for '${f.output.val}' is not implemented yet ` + markPosition(f.output, lines) + endl;
        msg += 'available templates are: ' + listTemplates().join(', ');
        err(new JsccError(msg));
    }

    if(hasError()){
        terminated = true;
        return ret;
    }
    // don't proceed if any error has been detected
    g.genFirstSets();

    var temp = genItemSets(g);
    itemSets = temp.result;
    iterationCount = temp.iterations;
    var temp2 = genParseTable(g, itemSets);
    temp2.result.findDefAct();
    // result.parseTable = temp2.result;
    parseTable = new CompressedPTable(temp2.result);

    for(let cf of temp2.conflicts){
        warn(new JsccWarning(cf.toString()));
    }

    return ret;

    function warn(w: JsccWarning){
        warnings.push(w);
    }
    function err(e: JsccError){
        errors.push(e);
    }
    function printItemSets(stream: OutputStream){
        stream.writeln(itemSets.size + ' state(s) in total,finished in ' + iterationCount + ' iteration(s).');
        itemSets.forEach(function(s){
            stream.writeln(s.toString({ showTrailer: true }));
        });
    }
    function printTable (os: OutputStream){
        printParseTable(os, parseTable, itemSets);
    }
    function printDFA(os: OutputStream){
        for(let s of file.lexDFA){
            s.print(os);
            os.writeln();
            os.writeln();
        }
    }
    function testParse(tokens: string[]){
        return testParse2(file.grammar,parseTable,tokens);
    }
    function printError(os: OutputStream, opt: Option){
        for(let e of errors){
            os.writeln(e.toString(opt));
        }
        os.writeln();
    }
    function printWarning(os: OutputStream, opt: Option){
        for(let w of warnings){
            os.writeln(w.toString(opt));
        }
        os.writeln();
    }
    function hasWarning(){
        return warnings.length > 0;
    }
    function hasError(){
        return errors.length > 0;
    }
    function warningSummary(){
        return `${warnings.length} warning(s), ${errors.length} error(s)`;
    }
    function getTemplateInput(): TemplateInput{
        return {
            endl: '\n',
            output: f.output.val,
            pt: parseTable,
            file: file
        };
    }
}
