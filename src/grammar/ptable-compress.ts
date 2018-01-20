import { ParseTable, IParseTable } from './ptable';
import { compress, Table } from '../util/compress';
import { Item } from './item-set';
import { Grammar } from './grammar';
import { console } from '../util/common';
import { initArray } from '../util/initarray';

function action(pt: ParseTable): Table{
    let emCount: number[] = [];
    for(let state = 0;state < pt.stateCount;state++){
        emCount.push(0);
        for(let tk = 0;tk < pt.g.tokens.length;tk++){
            pt.lookupShift(state, tk) === null && (emCount[state]++);
        }
    }
    return {
        rows: pt.stateCount,
        columns: pt.g.tokens.length,
        isEmpty(state, token){
            return pt.lookupShift(state, token) === null;
        },
        emptyCount(state){
            return emCount[state];
        }
    };
}

function gotot(pt: ParseTable): Table{
    let emCount: number[] = [];
    for(let state = 0;state < pt.stateCount;state++){
        emCount.push(0);
        for(let nt = 0;nt < pt.g.nts.length;nt++){
            pt.lookupShift(state, nt) === null && (emCount[state]++);
        }
    }
    return {
        rows: pt.stateCount,
        columns: pt.g.nts.length,
        isEmpty(state, nt){
            return pt.lookupGoto(state, nt) === null;
        },
        emptyCount(nt){
            return emCount[nt];
        }
    };
}


export class CompressedPTable implements IParseTable{
    g: Grammar;
    stateCount: number;
    // action table
    pact: Item[];
    // displacement of action table
    disact: number[];
    // check 
    checkact: number[];
    // default reduction
    defred: number[];

    pgoto: Item[];
    disgoto: number[];
    checkgoto: number[];

    constructor(ptable: ParseTable){
        this.g = ptable.g;
        this.defred = ptable.defred;
        this.stateCount = ptable.stateCount;

        let actionCResult = compress(action(ptable));
        let gotoCResult = compress(gotot(ptable));
        this.disact = actionCResult.dps;
        this.disgoto = gotoCResult.dps;

        this.pact = initArray<Item>(actionCResult.len, () => null);
        this.checkact = initArray<number>(actionCResult.len, () => 0);
        let cela = this;
        ptable.forEachShift((it, state, token) => {
            console.assert(cela.pact[cela.disact[state] + token] === null);
            cela.pact[cela.disact[state] + token] = it;
            cela.checkact[cela.disact[state] + token] = state;
        });

        this.pgoto = initArray<Item>(gotoCResult.len, () => null);
        this.checkgoto = initArray<number>(gotoCResult.len, () => 0);
        ptable.forEachGoto((it, state, nt) => {
            console.assert(cela.pgoto[cela.disgoto[state] + nt] === null);
            cela.pgoto[cela.disgoto[state] + nt] = it;
            cela.checkgoto[cela.disgoto[state] + nt] = state;
        });
    }
    lookupShift(state: number, token: number){
        let index = this.disact[state] + token;
        if(index >= 0 && index < this.pact.length && this.checkact[index] === state){
            return this.pact[this.disact[state] + token];
        }
        else {
            return null;
        }
    }
    lookupGoto(state: number, nt: number){
        let index = this.disgoto[state] + nt;
        if(index >= 0 && index < this.pgoto.length && this.checkgoto[index] === state){
            return this.pgoto[this.disgoto[state] + nt];
        }
        else {
            return null;
        }
    }
}
