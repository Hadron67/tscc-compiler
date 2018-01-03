import { genItemSets,genParseTable, Conflict } from '../grammar/ptable-gen';
import { parseSource } from '../parser/gparser';
import { lexer } from '../lexer/pattern';
import { testParse } from './parse-test';
import { YYTAB } from '../util/common';
import { File } from '../parser/file';
import { ItemSet } from '../grammar/item-set';
import { ParseTable } from '../grammar/ptable';
import { TokenDef } from '../grammar/token-entry';
import { NtDef } from '../grammar/grammar';
import { List } from '../util/list';
import { OutputStream, InputStream } from '../util/io';
import { Context } from '../util/context';
import { JsccError, JsccWarning, Option } from '../util/E';

class Result implements Context{
    file: File;
    itemSets: List<ItemSet>;
    iterationCount: number;
    parseTable: ParseTable;
    // conflicts: Conflict[];
    // unusedTokens: TokenDef[] = [];
    // unusedNts: NtDef[] = [];

    errors: JsccError[] = [];
    warnings: JsccError[] = [];
    terminated = false;

    warn(w: JsccWarning){
        this.warnings.push(w);
    }
    err(e: JsccError){
        this.errors.push(e);
    }
    printItemSets(stream: OutputStream){
        stream.writeln(this.itemSets.size + ' state(s) in total,finished in ' + this.iterationCount + ' iteration(s).');
        this.itemSets.forEach(function(s){
            stream.writeln(s.toString({ showTrailer: true }));
        });
    }
    printTable (stream: OutputStream){
        this.parseTable.summary(this.itemSets,stream);
    }
    printDFA(os: OutputStream){
        for(let s of this.file.lexDFA){
            s.print(os);
            os.writeln();
            os.writeln();
        }
    }
    testParse(tokens: string[]){
        return testParse(this.file.grammar,this.parseTable,tokens);
    }
    printError(os: OutputStream, opt: Option){
        for(let e of this.errors){
            os.writeln(e.toString(opt));
        }
        os.writeln();
    }
    printWarning(os: OutputStream, opt: Option){
        for(let w of this.warnings){
            os.writeln(w.toString(opt));
        }
        os.writeln();
    }
    hasWarning(){
        return this.warnings.length > 0;
    }
    hasError(){
        return this.errors.length > 0;
    }
    warningSummary(){
        return `${this.warnings.length} warning(s), ${this.errors.length} error(s)`;
    }
}

function genResult(stream: InputStream){
    var result = new Result();
    try{
        var f = parseSource(stream, result);
    }
    catch(e){
        result.terminated = true;
        result.err(e as JsccError);
        return result;
    }
    var g = f.grammar;
    result.file = f;
    // we still could have error here
    for(var s of g.tokens){
        if(!s.used){
            result.warn(new JsccWarning(`token <${s.sym}> is never used (defined at line ${s.line})`));
        }
    }
    for(var s2 of g.nts){
        if(!s2.used){
            result.warn(new JsccWarning(`non terminal "${s2.sym}" is unreachable`));
        }
    }

    if(result.hasError()){
        result.terminated = true;
        return result;
    }
    // don't proceed if any error has been detected
    g.genFirstSets();

    var temp = genItemSets(g);
    result.itemSets = temp.result;
    result.iterationCount = temp.iterations;
    var temp2 = genParseTable(g,result.itemSets);
    result.parseTable = temp2.result;

    for(let cf of temp2.conflicts){
        result.warn(new JsccWarning(cf.toString()));
    }
    
    return result;
}

export { genResult };