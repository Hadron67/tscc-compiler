import { BitSet } from '../util/bitset';
import { TokenEntry } from './token-entry';

export class TokenSet extends BitSet{
    constructor(tcount: number){
        super(tcount);
    }
    toString(g: TokenEntry): string{
        var ret = '';
        var first = true;
        if(this.contains(0)){
            ret += '""';
            first = false;
        }
        for(var i = 0;i < g.tokenCount;i++){
            if(this.contains(i + 1)){
                if(!first){
                    ret += ',';
                }
                ret += '"' + g.tokens[i].sym + '"';
                first = false;
            }
        }
        return ret;
    }
}