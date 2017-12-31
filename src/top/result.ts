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
    testParse(tokens: string[]){
        return testParse(this.file.grammar,this.parseTable,tokens);
    }
    printError(os: OutputStream, opt: Option){
        for(let e of this.errors){
            os.writeln(e.toString(opt));
        }
    }
    printWarning(os: OutputStream, opt: Option){
        for(let w of this.warnings){
            os.writeln(w.toString(opt));
        }
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
    // warningMsg(): string{
    //     var ret = '';
    //     if(this.unusedTokens.length > 0){
    //         ret += 'unused tokens:\n';
    //         for(var t of this.unusedTokens){
    //             ret += YYTAB + '"' + t.sym + '" (defined at line ' + t.line + ')\n';
    //         }
    //     }
    //     if(this.unusedNts.length > 0){
    //         ret += 'unused non terminals:\n';
    //         for(var t2 of this.unusedNts){
    //             ret += YYTAB + t2.sym + '\n';
    //         }
    //     }
    //     for(var cf of this.conflicts){
    //         ret += cf.toString() + '\n';
    //     }
    //     return ret;
    // }
}

function genResult(stream: InputStream){
    var result = new Result();
    try{
        var f = parseSource(stream, result);
    }
    catch(e){
        result.err(e as JsccError);
    }
    if(result.hasError()){
        return result;
    }
    var g = f.grammar;
    g.genFirstSets();
    result.file = f;

    var temp = genItemSets(g);
    result.itemSets = temp.result;
    result.iterationCount = temp.iterations;
    var temp2 = genParseTable(g,result.itemSets);
    result.parseTable = temp2.result;

    // var conflicts = temp2.conflicts;
    for(let cf of temp2.conflicts){
        result.warn(new JsccWarning(cf.toString()));
    }
    for(var s of g.tokens){
        if(!s.used){
            result.warn(new JsccWarning(`unused token "${s.sym}" (defined at line ${s.line})`));
        }
    }
    for(var s2 of g.nts){
        if(!s2.used){
            result.warn(new JsccWarning(`unused non terminal "${s2.sym}"`));
        }
    }

    return result;
}

export { genResult };