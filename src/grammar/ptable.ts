import { Grammar } from './grammar';
import { YYTAB } from '../util/common';
import { endl, OutputStream } from '../util/io';
import { Action, Item, ItemSet } from './item-set';
import { List } from '../util/list';
import { convertTokenToString } from './token-entry';

export interface IParseTable{
    readonly g: Grammar;
    readonly stateCount: number;
    defred: number[];
    lookupShift(state: number, token: number): Item;
    lookupGoto(state: number, nt: number): Item;
};

export function printParseTable(os: OutputStream, cela: IParseTable, doneList: List<ItemSet>){
    var g = cela.g;
    var tokenCount = g.tokenCount;
    var ntCount = g.nts.length;
    // function printSet(set: ItemSet, lines: string[]){
    //     var i = set.stateIndex;

    //     lines.push(`state ${i}`);        
    //     set.forEach(function(item){
    //         lines.push(YYTAB + item.toString({ showTrailer: false }));
    //     });
    //     if(cela.defred[i] !== -1){
    //         lines.push(`${YYTAB}default action: reduce with rule ${cela.defred[i]}`);
    //     }
    //     else {
    //         lines.push(YYTAB + 'no default action');
    //     }
    //     for(var j = 0;j < tokenCount;j++){
    //         var item = cela.lookupShift(i,j);
    //         if(item !== null && item !== Item.NULL){
    //             if(item.actionType === Action.SHIFT){
    //                 lines.push(`${YYTAB}${convertTokenToString(g.tokens[j])} : shift, and goto state ${item.shift.stateIndex}`);
    //             }
    //             else {
    //                 lines.push(`${YYTAB}${convertTokenToString(g.tokens[j])} : reduce with rule ${item.rule.index}`);
    //             }
    //         }
    //     }
    //     for(var j = 0;j < ntCount;j++){
    //         var item = cela.lookupGoto(i,j);
    //         if(item !== null){
    //             lines.push(`${YYTAB}${g.nts[j].sym} : goto state ${item.shift.stateIndex}`);
    //         }
    //     }
    //     lines.push('');
    // }
    // let it = doneList.iterator();
    // let lines: string[] = [];
    // function writeOne(){
    //     let set = it();
    //     if(set !== null){
    //         lines.length = 0;
    //         printSet(set, lines);
    //         os.write(lines.join(endl), writeOne);
    //     }
    //     else {
    //         done && done
    //     }
    // }
    doneList.forEach(function(set){
        var i = set.stateIndex;
        var shift = '';
        var reduce = '';
        var gotot = '';
        var defred = '';
        os.writeln(`state ${i}`);        
        set.forEach(function(item){
            os.writeln(YYTAB + item.toString({ showTrailer: false }));
        });
        if(cela.defred[i] !== -1){
            os.writeln(`${YYTAB}default action: reduce with rule ${cela.defred[i]}`);
        }
        else {
            os.writeln(YYTAB + 'no default action');
        }
        for(var j = 0;j < tokenCount;j++){
            var item = cela.lookupShift(i,j);
            if(item !== null && item !== Item.NULL){
                if(item.actionType === Action.SHIFT){
                    shift += `${YYTAB}${convertTokenToString(g.tokens[j])} : shift, and goto state ${item.shift.stateIndex}${endl}`;
                }
                else {
                    reduce += `${YYTAB}${convertTokenToString(g.tokens[j])} : reduce with rule ${item.rule.index}${endl}`;
                }
            }
        }
        for(var j = 0;j < ntCount;j++){
            var item = cela.lookupGoto(i,j);
            if(item !== null){
                gotot += `${YYTAB}${g.nts[j].sym} : goto state ${item.shift.stateIndex}${endl}`;
            }
        }
        os.writeln(shift + reduce + gotot);
        os.writeln('');
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
