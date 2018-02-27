import { genItemSets,genParseTable, Conflict } from '../grammar/ptable-gen';
import { lexer } from '../lexer/pattern';
import { testParse } from './parse-test';
import { File } from '../parser/file';
import { ItemSet } from '../grammar/item-set';
import { ParseTable, IParseTable, printParseTable } from '../grammar/ptable';
import { TokenDef } from '../grammar/token-entry';
import { NtDef } from '../grammar/grammar';
import { List } from '../util/list';
import { OutputStream, StringIS } from '../util/io';
import { Context } from '../util/context';
import { JsccError, JsccWarning, ErrPrintOption } from '../util/E';
import { CompressedPTable } from '../grammar/ptable-compress';
import { TemplateInput } from '../codegen/def';
import { yyparse } from '../parser/parser';
import { templateExists, listTemplates, FileCreator, generateCode } from '../codegen/template';
import { markPosition } from '../parser/node';
import { DFATable } from '../lexer/dfa-table';
import { LexAction } from '../lexer/action';
import { io } from '../main';
import { EscapeDef, escapeString } from '../util/span';

export interface TSCCContext {
    compile(source: string, fname: string);
    reset();
    setEscape(e: {[s: string]: string});
    beginTime(s: string);
    endTime();
    printItemSets(stream: OutputStream);
    printTable (os: OutputStream, showlah: boolean, showFullItemsets: boolean);
    printDFA(os: OutputStream);
    printError(os: OutputStream, opt?: ErrPrintOption);
    printWarning(os: OutputStream, opt?: ErrPrintOption);
    printDetailedTime(os: OutputStream);
    hasWarning(): boolean;
    hasError(): boolean;
    warningSummary(): string;
    isTerminated(): boolean;
    testParse(tokens: string[], onErr: (msg: string) => any): string[];
    genCode(fc: FileCreator);
}
export function createContext(): TSCCContext{
    let file: File = null;
    let itemSets: List<ItemSet> = null;
    let iterationCount: number = 0;
    let parseTable: CompressedPTable = null;

    let errors: JsccError[] = [];
    let warnings: JsccError[] = [];
    let needLinecbs: ((ctx: Context, lines: string[]) => any)[] = [];
    let terminated = false;
    let timers: {name: string, start: Date, end: Date}[] = [];

    let escapes: EscapeDef = null;

    let ctx: Context = {
        warn,
        err,
        requireLines: cb => needLinecbs.push(cb),
        beginTime,
        endTime,
    };

    return {
        compile,
        setEscape,
        reset,
        beginTime,
        endTime,
        printItemSets,
        printTable,
        printDFA,
        testParse: (tokens, onErr) => testParse(file.grammar, parseTable, tokens, onErr),
        printError,
        printWarning,
        printDetailedTime,
        hasWarning,
        hasError,
        warningSummary: () => `${warnings.length} warning(s), ${errors.length} error(s)`,
        genCode,
        isTerminated: () => terminated,
    };

    function reset(){
        file = null;
        itemSets = null;
        iterationCount = 0;
        parseTable = null;

        errors.length = 0;
        warnings.length = 0;
        needLinecbs.length = 0;
        terminated = false;
        timers.length = 0;
    }
    function setEscape(e: {[s: string]: string}){
        escapes = escapes || {};
        for(var from in e){
            escapes[from] = e[from];
        }
    }
    function escape(s: string): string{
        return escapes ? escapeString(s, escapes) : s;
    }
    function compile(source: string, fname: string){
        reset();
        var f = yyparse(ctx, source);
        let lines = source.split(f.eol);
        for(let cb of needLinecbs){
            cb(ctx, lines);
        }
        if(hasError()){
            terminated = true;
            return;
        }
        f.name = fname;
        var g = f.grammar;
        file = f;
        // we still could have errors here
        for(var s of g.tokens){
            if(!s.used){
                let msg = `token <${s.sym}> is never used, definations are(is):\n`;
                for(let pos of s.appears){
                    msg += markPosition(pos, lines) + '\n';
                }
                warn(new JsccWarning(msg));
            }
        }
        for(var s2 of g.nts){
            if(!s2.used){
                warn(new JsccWarning(`non terminal "${s2.sym}" is unreachable`));
            }
        }
        if(f.output !== null && !templateExists(f.output.val)){
            let msg = `template for '${f.output.val}' is not implemented yet ` + markPosition(f.output, lines) + '\n';
            msg += 'available templates are: ' + listTemplates().join(', ');
            err(new JsccError(msg));
        }
    
        if(hasError()){
            terminated = true;
            return;
        }
        // don't proceed if any error has been detected
        beginTime('generate first sets');
        g.genFirstSets();
        endTime();
    
        beginTime('generate item sets');
        var temp = genItemSets(g);
        endTime();
    
        itemSets = temp.result;
        iterationCount = temp.iterations;
    
        beginTime('generate parse table');
        var temp2 = genParseTable(g, itemSets);
        endTime();
    
        temp2.result.findDefAct();
    
        beginTime('compress parse table');
        parseTable = new CompressedPTable(temp2.result);
        endTime();
    
        for(let cf of temp2.conflicts){
            warn(new JsccWarning(cf.toString()));
        }
    
        beginTime('generate lexical DFA tables');
        for(let dfa of file.lexDFA){
            file.dfaTables.push(new DFATable<LexAction>(dfa));
        }
        endTime();
    }
    function beginTime(name: string){
        timers.push({ name, start: new Date(), end: null});
    }
    function endTime(){
        timers[timers.length - 1].end = new Date();
    }
    function warn(w: JsccWarning){
        warnings.push(w);
    }
    function err(e: JsccError){
        errors.push(e);
    }
    function printItemSets(os: OutputStream){
        os.writeln(`${itemSets.size} state(s) in total,finished in ${iterationCount} iteration(s).`);
        itemSets.forEach(function(s){
            os.writeln(escape(s.toString({ showTrailer: true })));
        });
    }
    function printTable (os: OutputStream, showlah: boolean, showFullItemsets: boolean){
        printParseTable(os, parseTable, itemSets, showlah, showFullItemsets, escapes);
    }
    function printDetailedTime(os: OutputStream){
        for(var t of timers){
            os.writeln(`${t.name}: ${(t.end.valueOf() - t.start.valueOf()) / 1000}s`);
        }
    }
    function printDFA(os: OutputStream){
        var i = 0;
        for(let s of file.dfaTables){
            os.writeln(`DFA state ${i}`);
            s.print(os, escapes);
            os.writeln();
            os.writeln();
            i++;
        }
    }
    function printError(os: OutputStream, opt?: ErrPrintOption){
        for(let e of errors){
            os.writeln(e.toString(opt).toString(escapes));
        }
        os.writeln();
    }
    function printWarning(os: OutputStream, opt?: ErrPrintOption){
        for(let w of warnings){
            os.writeln(w.toString(opt).toString(escapes));
        }
        os.writeln();
    }
    function hasWarning(){
        return warnings.length > 0;
    }
    function hasError(){
        return errors.length > 0;
    }
    function genCode(fc: FileCreator){
        var tempin = getTemplateInput();
        generateCode(tempin.output, tempin, fc);
    }
    function getTemplateInput(): TemplateInput{
        return {
            endl: file.eol,
            output: file.output === null ? 'typescript' : file.output.val,
            pt: parseTable,
            file: file
        };
    }
}
