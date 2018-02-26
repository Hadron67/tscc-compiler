import { Grammar } from './grammar';
import { OutputStream } from '../util/io';
import { Action, Item, ItemSet } from './item-set';
import { List } from '../util/list';
import { convertTokenToString } from './token-entry';
import { EscapeDef } from '../util/span';

export interface IParseTable{
    readonly g: Grammar;
    readonly stateCount: number;
    defred: number[];
    lookupShift(state: number, token: number): Item;
    lookupGoto(state: number, nt: number): Item;
};

export function printParseTable(
    os: OutputStream, 
    cela: IParseTable, 
    doneList: List<ItemSet>, 
    showlah: boolean, 
    showFullItemsets: boolean,
    escapes: EscapeDef[]
){
    var g = cela.g;
    var tokenCount = g.tokenCount;
    var ntCount = g.nts.length;
    var tab = '    ';
    doneList.forEach(function(set){
        var i = set.stateIndex;
        var shift = '';
        var reduce = '';
        var gotot = '';
        var defred = '';
        os.writeln(`state ${i}`);        
        set.forEach(function(item){
            (showFullItemsets || item.isKernel) && os.writeln(tab + item.toString({ showlah }));
        });
        if(cela.defred[i] !== -1){
            os.writeln(`${tab}default action: reduce with rule ${cela.defred[i]}`);
        }
        else {
            os.writeln(tab + 'no default action');
        }
        for(var j = 0;j < tokenCount;j++){
            var item = cela.lookupShift(i,j);
            if(item !== null && item !== Item.NULL){
                if(item.actionType === Action.SHIFT){
                    shift += `${tab}${convertTokenToString(g.tokens[j])} : shift, and go to state ${item.shift.stateIndex}\n`;
                }
                else {
                    reduce += `${tab}${convertTokenToString(g.tokens[j])} : reduce with rule ${item.rule.index}\n`;
                }
            }
        }
        for(var j = 0;j < ntCount;j++){
            var item = cela.lookupGoto(i,j);
            if(item !== null){
                gotot += `${tab}${g.nts[j].sym} : go to state ${item.shift.stateIndex}\n`;
            }
        }
        var line = shift + reduce + gotot;
        for(var es of escapes){
            line = line.replace(es.from, es.to);
        }
        os.writeln(line);
        os.writeln();
    });
}

export class ParseTable implements IParseTable{
    g: Grammar;
    stateCount: number;
    shift: Item[];
    gotot: Item[];

    defred: number[] = null;
    constructor(g: Grammar, stateCount: number){
        this.g = g;
        var tokenCount = g.tokenCount;
        var ntCount = g.nts.length;
        this.stateCount = stateCount;
        this.shift = new Array(tokenCount * stateCount);
        this.gotot = new Array(ntCount * stateCount);
        for(var i = 0;i < this.shift.length;i++){
            this.shift[i] = null;
        }
        for(var i = 0;i < this.gotot.length;i++){
            this.gotot[i] = null;
        }
    }
    forEachShift(cb: (it: Item, state: number, token: number) => any){
        for(let state = 0; state < this.stateCount; state++){
            for(let tk = 0; tk < this.g.tokens.length; tk++){
                let item = this.lookupShift(state, tk);
                item && cb(item, state, tk);
            }
        }
    }
    forEachGoto(cb: (it: Item, state: number, nt: number) => any){
        for(let state = 0; state < this.stateCount; state++){
            for(let nt = 0; nt < this.g.nts.length; nt++){
                let item = this.lookupGoto(state, nt);
                item && cb(item, state, nt);
            }
        }
    }
    lookupShift(state: number, token: number): Item{
        return this.shift[this.g.tokenCount * state + token];
    }
    lookupGoto(state: number, nt: number): Item{
        return this.gotot[this.g.nts.length * state + nt];
    }
    private _getDefRed(state: number, apool: number[]): number{
        for(let i = 0; i < apool.length; i++){
            apool[i] = 0;
        }
        for(let tk = 0; tk < this.g.tokenCount; tk++){
            let item = this.lookupShift(state, tk);
            item && item.actionType === Action.REDUCE && apool[item.rule.index]++;
        }
        let ret = 0;
        for(let i = 0;i < apool.length;i++){
            apool[i] > apool[ret] && (ret = i);
        }
        return apool[ret] > 0 ? ret : -1;
    }
    findDefAct(){
        this.defred = new Array(this.stateCount);
        let apool = new Array(this.g.rules.length);
        for(let i = 0;i < this.stateCount; i++){
            let def = this._getDefRed(i, apool);
            this.defred[i] = def;
            if(def !== -1){
                for(let tk = 0;tk < this.g.tokens.length;tk++){
                    let item = this.lookupShift(i, tk);
                    item && item.actionType === Action.REDUCE && item.rule.index === def &&
                    (this.shift[this.g.tokenCount * i + tk] = null);
                }
            }
        }
    }
}
