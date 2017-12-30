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
import { OutputStream } from '../util/io';

class Result{
    file: File;
    itemSets: List<ItemSet>;
    iterationCount: number;
    parseTable: ParseTable;
    conflicts: Conflict[];
    unusedTokens: TokenDef[] = [];
    unusedNts: NtDef[] = [];

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
    warningMsg(): string{
        var ret = '';
        if(this.unusedTokens.length > 0){
            ret += 'unused tokens:\n';
            for(var t of this.unusedTokens){
                ret += YYTAB + '"' + t.sym + '" (defined at line ' + t.line + ')\n';
            }
        }
        if(this.unusedNts.length > 0){
            ret += 'unused non terminals:\n';
            for(var t2 of this.unusedNts){
                ret += YYTAB + t2.sym + '\n';
            }
        }
        for(var cf of this.conflicts){
            ret += cf.toString() + '\n';
        }
        return ret;
    }
}

function genResult(stream: OutputStream){
    var result = new Result();
    var f = parseSource(stream);
    var g = f.grammar;
    g.genFirstSets();
    result.file = f;

    var temp = genItemSets(g);
    result.itemSets = temp.result
    result.iterationCount = temp.iterations;
    var temp2 = genParseTable(g,result.itemSets);
    result.parseTable = temp2.result;
    result.conflicts = temp2.conflicts;

    for(var s of g.tokens){
        if(!s.used){
            result.unusedTokens.push(s);
        }
    }
    for(var s2 of g.nts){
        if(!s2.used){
            result.unusedNts.push(s2);
        }
    }

    return result;
}

export { genResult };