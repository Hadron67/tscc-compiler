import { TokenSet } from './token-set';
import { Rule, Grammar } from './grammar';
import { ListNode } from '../util/list';

export enum Action {
    NONE = 1,
    SHIFT,
    REDUCE
}

export interface ItemSetPrintOpt {
    showlah?: boolean; 
    showTrailer?: boolean;
}

export class Item{
    public marker: number = 0;
    public lah: TokenSet;
    public rule: Rule;
    public isKernel: boolean;
    public shift: ItemSet = null;
    public actionType = Action.NONE;
    public changed: boolean = true;
    static NULL: Item = {} as Item;
    constructor(rule: Rule, ik: boolean){
        this.rule = rule;
        this.isKernel = ik;
        this.lah = new TokenSet(rule.g.tokenCount);
    }
    canShift(): boolean{
        return this.rule.rhs.length > this.marker;
    }
    getShift(): number{
        return this.rule.rhs[this.marker];
    }
    toString(opt?: ItemSetPrintOpt): string {
        var showlah = (opt && opt.showlah) || false;
        var showTrailer = (opt && opt.showTrailer) || false;
        var r = this.rule;
        var ret = '[ ' + this.rule.toString(this.marker) + (showlah ? ', { ' + this.lah.toString(this.rule.g) + ' }' : '') + ' ]';
    
        this.isKernel && (ret += '*');
        if(showTrailer){
            switch(this.actionType){
                case Action.NONE: ret += '(-)';break;
                case Action.SHIFT: ret += '(s' + this.shift.stateIndex + ')';break;
                case Action.REDUCE: ret += '(r)';break;
            }
        }
        return ret;
    }
    hash(): string{
        return this.rule.index + '-' + this.marker;
    }
    hasRRConflictWith(i: Item): boolean{
        return this.actionType === Action.REDUCE && i.actionType === Action.REDUCE && this.rule.index !== i.rule.index && this.lah.hasIntersection(i.lah);
    }
    getFollowSet(set: TokenSet): void{
        var g = this.rule.g;
        var i;
        for(i = this.marker + 1;i < this.rule.rhs.length;i++){
            var mItem = this.rule.rhs[i];
            if(g.isToken(mItem)){
                set.add(mItem + 1);
                break;
            }
            else {
                //var set1 = g.sym[mItem].firstSet
                var set1 = g.nts[-mItem - 1].firstSet
                set.union(set1);
                set.remove(0);
                if(!set1.contains(0)){
                    break;
                }
            }
        }
        if(i === this.rule.rhs.length){
            set.union(this.lah);
        }
    }
}

export class ItemSet implements ListNode<ItemSet>{
    g: Grammar;
    // it: { [s: string]: Item } = {};
    items: Item[] = [];
    // item table, indexed by rule number
    itemTable: Item[][] = [];
    reduces: Item[] = [];
    complete: boolean = false;

    index: number = -1;
    stateIndex: number = 0;

    prev: ItemSet = null;
    next: ItemSet = null;
    data: ItemSet;
    merges: number[] = [];

    constructor(g: Grammar){
        this.g = g;
        this.data = this;
    }

    add(rule: Rule, marker: number, ik: boolean, lah: TokenSet, reset: boolean): boolean{
        var entry = this.itemTable[rule.index] = this.itemTable[rule.index] || [];
        var it = entry[marker];
        if(it === undefined){
            var n = new Item(rule,ik);
            n.marker = marker;
            if(lah){
                n.lah.union(lah);
            }
            entry[marker] = n;
            this.items.push(n);
            marker === rule.rhs.length && this.reduces.push(n);
            return true;
        }
        else if(lah){
            var ret = it.lah.union(lah);
            if(reset && ret && it.canShift()){
                it.actionType = Action.NONE;
            }
            ret && (it.changed = true);
            return ret;
        }
    }
    contains(){
        
    }
    closure(): void{
        var changed = true;
        var tSet = new TokenSet(this.g.tokenCount);
        var cela = this;
        while(changed){
            changed = false;
            for(var item of this.items){
                if(item.changed && item.canShift()){
                    var ritem = item.getShift();
                    if(ritem < 0){
                        tSet.removeAll();
                        item.getFollowSet(tSet);
                        this.g.forEachRuleOfNt(-ritem - 1, rule => {
                            changed = cela.add(rule, 0, false, tSet, false) || changed;
                            return false;
                        });
                    }
                }
                item.changed = false;
            }
        }
    }
    toString(opt?: ItemSetPrintOpt): string{
        var showlah = (opt && opt.showlah) || false;
        var showTrailer = (opt && opt.showTrailer) || false;
        var ret = 's' + this.stateIndex + '';
        if(this.index !== null){
            ret += '(i' + this.index;
        }
        else {
            ret += '(i?';
        }
        if(this.merges.length > 0){
            ret += ', merged from ';
            for(var i = 0;i < this.merges.length;i++){
                if(i > 0){
                    ret += ', ';
                }
                ret += 'i' + this.merges[i];
            }
        }
        ret += ')\n';
        for(var item of this.items){
            ret += item.toString(opt) + '\n';
        }
        return ret;
    }
    kernelHash(): string{
        var ret = 0;
        for(var item of this.items){
            if(item.isKernel){
                ret += item.rule.index << 5 + item.rule.index + item.marker;
            }
        }
        return String(ret);
    }
    forEach(cb: (it: Item) => void){
        for(var item of this.items){
            cb(item);
        }
    }
    canMergeTo(s: ItemSet): boolean{
        var dup: boolean = true;
        for(var i = 0; i < this.g.rules.length; i++){
            var t1 = this.itemTable[i], t2 = s.itemTable[i];
            dup = dup && !!(t1 && t2 || !t1 && !t2);
            if(t1 || t2){
                var rhs = this.g.rules[i].rhs;
                // check for identical LR0 kernel items
                for(var j = 0; j <= rhs.length; j++){
                    if(
                        t1 && t1[j] && t1[j].isKernel && (!t2 || !t2[j] || !t2[j].isKernel)
                    ||  t2 && t2[j] && t2[j].isKernel && (!t1 || !t1[j] || !t1[j].isKernel)
                    ){
                        return false;
                    }
                    else {
                        dup = dup && (!t1 && !t1 && !t1[j] && !t2[j] || t1 && t2 && t1[j] && t2[j] && t1[j].lah.equals(t2[j].lah) );
                    }
                }
            }
        }
        if(!dup){
            for(var rit of this.reduces){
                for(var rit2 of s.reduces){
                    if(rit.rule !== rit2.rule && rit.lah.hasIntersection(rit2.lah)){
                        return false;
                    }
                }
            }
        }
        return true;
    }
    mergeTo(s: ItemSet): boolean{
        var ret = false;
        for(var it of s.items){
            ret = this.add(it.rule, it.marker, it.isKernel, it.lah, true) || ret;
        }
        this.merges.push(s.index);
        return ret;
    }
}
