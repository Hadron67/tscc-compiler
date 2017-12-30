import { ParseTable } from './ptable.js';
import { compress } from '../util/compress.js';
import { Item } from './item-set.js';

class CompressedPTable{
    pact: Item[];
    disact: number[];
    checkact: number[];
    defact: Item[];

    pgoto: Item[];
    disgoto: number[];

    constructor(ptable: ParseTable){
        
    }
}
