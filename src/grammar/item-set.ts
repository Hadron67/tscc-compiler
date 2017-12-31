import { TokenSet } from './token-set';
import { Rule, Grammar } from './grammar';
import { ListNode } from '../util/list';

export enum Action {
    NONE = 1,
    SHIFT,
    REDUCE
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
    toString(opt: { showlah?: boolean, showTrailer?: boolean } = {}): string{
        var showlah = (opt && opt.showlah) || false;
        var showTrailer = (opt && opt.showTrailer) || false;
        var r = this.rule;
        var ret = '[ ' + this.rule.toString(this.marker) + (showlah ? ',{ ' + this.lah.toString(this.rule.g) + ' }' : '') + ' ]';
    
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
    it: { [s: string]: Item } = {};
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
        var h = rule.index + '-' + marker;
        var it = this.it[h];
        if(it === undefined){
            var n = new Item(rule,ik);
            n.marker = marker;
            if(lah){
                n.lah.union(lah);
            }
            this.it[h] = n;
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
            for(var hash in this.it){
                var item = this.it[hash];
                if(item.changed && item.canShift()){
                    var ritem = item.getShift();
                    if(ritem < 0){
                        tSet.removeAll();
                        item.getFollowSet(tSet);
                        this.g.forEachRuleOfNt(-ritem - 1,function(rule){
                            changed = cela.add(rule,0,false,tSet,false) || changed;
                            return false;
                        });
                    }
                }
                item.changed = false;
            }
        }
    }
    toString(opt: { showlah?: boolean, showTrailer?: boolean }): string{
        var showlah = (opt && opt.showlah) || false;
        var showTrailer = (opt && opt.showTrailer) || false;
        var opt2 = { showTrailer: showTrailer };
        var ret = 's' + this.stateIndex + '';
        if(this.index !== null){
            ret += '(i' + this.index;
        }
        else {
            ret += '(i?';
        }
        if(this.merges.length > 0){
            ret += ',merged from ';
            for(var i = 0;i < this.merges.length;i++){
                if(i > 0){
                    ret += ',';
                }
                ret += 'i' + this.merges[i];
            }
        }
        ret += ')\n';
        for(var hash in this.it){
            ret += this.it[hash].toString(opt2) + '\n';
        }
        return ret;
    }
    kernelHash(): string{
        var ret = 0;
        for(var hash in this.it){
            var item = this.it[hash];
            if(item.isKernel){
                ret += item.rule.index << 5 + item.rule.index + item.marker;
            }
        }
        return String(ret);
    }
    forEach(cb: (it: Item) => void){
        for(var h in this.it){
            cb(this.it[h]);
        }
    }
    canMergeTo(s: ItemSet): boolean{
        for(var h1 in this.it){
            var it1 = this.it[h1];
            var found = false,hasConflict = false,hasIdentical = false;
            for(var h2 in s.it){
                var it2 = s.it[h2];
                if(it1.rule.index === it2.rule.index && it1.marker === it2.marker){
                    hasIdentical = it1.lah.equals(it2.lah);
                    found = it1.isKernel && it2.isKernel;
                }
                hasConflict = hasConflict || it1.hasRRConflictWith(it2);
                if(it2.isKernel && this.it[h2] === undefined){
                    return false;
                }
            }
            if(it1.isKernel && !found || hasConflict && !hasIdentical){
                return false;
            }
        }
        return true;
    }
    mergeTo(s: ItemSet): boolean{
        var ret = false;
        for(var h in s.it){
            var it = s.it[h];
            ret = this.add(it.rule,it.marker,it.isKernel,it.lah,true) || ret;
        }
        this.merges.push(s.index);
        return ret;
    }
}
