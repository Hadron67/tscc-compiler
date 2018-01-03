import { Grammar } from './grammar';
import { YYTAB } from '../util/common';
import { endl, OutputStream } from '../util/io';
import { Action, Item, ItemSet } from './item-set';
import { List } from '../util/list';
import { convertTokenToString } from './token-entry';

export class ParseTable{
    g: Grammar;
    stateCount: number;
    shift: Item[];
    gotot: Item[];

    defact: Item[] = null;
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
    lookupShift(state: number, token: number): Item{
        return this.shift[this.g.tokenCount * state + token];
    }
    lookupGoto(state: number, nt: number): Item{
        return this.gotot[this.g.nts.length * state + nt];
    }
    getDefAct(state: number): Item{
        for(let tk = 0; tk < this.g.tokenCount; tk++){
            let item = this.lookupShift(state, tk);
            if(item.actionType === Action.REDUCE){

            }
        }
        return null;
    }
    findDefAct(){
        this.defact = new Array(this.stateCount);
        for(let i = 0;i < this.stateCount; i++){
            for(let j = 0; j < this.g.tokenCount; j++){
                let item = this.lookupShift(i, j);
                if(item.actionType === Action.REDUCE){
                    // TODO: unfinished
                }
            }
        }
    }
    summary(doneList: List<ItemSet>, os: OutputStream){
        // var ret = '';
        var g = this.g;
        var tokenCount = g.tokenCount;
        var ntCount = g.nts.length;
        var cela = this;
        doneList.forEach(function(set){
            var i = set.stateIndex;
            var shift = '';
            var reduce = '';
            var gotot = '';
            os.writeln(`state ${i}`);        
            set.forEach(function(item){
                os.writeln(YYTAB + item.toString({ showTrailer: false }));
            });
            for(var j = 0;j < tokenCount;j++){
                var item = cela.lookupShift(i,j);
                if(item !== null){
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
            os.writeln();
        });
    }
}
