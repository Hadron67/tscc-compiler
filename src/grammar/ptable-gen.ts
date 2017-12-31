import { BitSet } from '../util/bitset';
import { Grammar } from './grammar';
import { console,YYTAB } from '../util/common';
import { OutputStream,endl } from '../util/io';
import { Item,Action,ItemSet } from './item-set';
import { List } from '../util/list';
import { ParseTable } from './ptable';
import { TokenDef, Assoc } from './token-entry';
import { TokenSet } from './token-set';

enum ConflictType {
    RR = 0, SR = 1
};
export class Conflict{
    type: ConflictType;
    set: ItemSet;
    token: TokenDef;
    used: Item;
    discarded: Item;
    static cNames: string[] = ['reduce/reduce','shift/reduce'];
    toString(): string{
        var ret = 'state ' + this.set.stateIndex + ',' + Conflict.cNames[this.type] + ' conflict:\n';
        ret += YYTAB + 'token: "' + this.token.sym + '"\n';
        ret += YYTAB + 'used rule: ' + this.used.toString() + '\n';
        ret += YYTAB + 'discarded rule: ' + this.discarded.toString() + '\n';
        return ret;
    }
}

export function genInitialSet(g: Grammar): ItemSet{
    var start = g.nts[0].rules[0];
    var iset = new ItemSet(g);
    iset.index = 0;
    var set1 = new TokenSet(g.tokenCount);
    set1.add(1);// eof
    iset.add(start,0,true,set1,false);

    return iset;
}

export function genItemSets(g: Grammar): { result: List<ItemSet>, iterations: number }{
    var htable = {}; 
    var iterations = 0;
    function addToTable(iset){
        var h = iset.kernelHash();
        if(htable[h] === undefined){
            htable[h] = [];
        }
        htable[h].push(iset);
    }
    function forEachInBucket(set,cb){
        var b = htable[set.kernelHash()];
        if(b !== undefined){
            for(var i = 0;i < b.length;i++){
                if(cb(b[i])) break;
            }
        }
    }
    var index = 1;
    var todoList = new List<ItemSet>();
    var incList = new List<ItemSet>();
    var doneList = new List<ItemSet>();
    todoList.append(genInitialSet(g));

    while(!todoList.isEmpty() || !incList.isEmpty()){
        var comeFrom = null;
        //phase 1,generate transition item set from incomplete list.
        if(!incList.isEmpty()){
            var set = comeFrom = incList.pull();
            set.forEach(function(item){
                if(item.actionType === Action.NONE){
                    console.assert(item.canShift());
                    var shift = item.getShift();
                    var newSet = new ItemSet(g);
                    newSet.index = index++;
                    todoList.append(newSet);
                    //mark all the symbols in 'set'
                    set.forEach(function(item1){
                        if(item1.canShift()){
                            var rItem = item1.getShift();
                            if(rItem === shift){
                                item1.actionType = Action.SHIFT;
                                item1.shift = newSet;
                                newSet.add(item1.rule,item1.marker + 1,true,item1.lah,false);
                            }
                        }
                    });
                }
            });
            set.complete = true;
            doneList.append(set);
        }

        //phase 2,find possible merges,and do them.
        while(!todoList.isEmpty()){
            var set = todoList.pull();
            set.closure();
            set.forEach(function(item){
                if(!item.canShift()){
                    item.actionType = Action.REDUCE;
                }
            });
            var merged = null;

            forEachInBucket(set,function(gSet){
                if(gSet.canMergeTo(set)){
                    if(gSet.mergeTo(set)){
                        if(gSet.complete){
                            merged = gSet;
                        }
                    }
                    //fix previous transition actions to merged set
                    if(comeFrom !== null){
                        comeFrom.forEach(function(sItem){
                            if(sItem.actionType === Action.SHIFT && sItem.shift === set){
                                sItem.shift = gSet;
                            }
                        });
                    }
                    set = null;
                    return true;
                }
                return false;
            });
            //if set is merged with another complete set,
            if(merged !== null){
                doneList.remove(merged);
                incList.append(merged);
                merged.complete = false;
            }
            //not merged
            else if(set !== null){
                incList.append(set);
                addToTable(set);
            }
        }
        iterations++;
    }
    var i = 0;
    doneList.forEach(function(set){
        set.stateIndex = i++;
    });

    return {
        result: doneList,
        iterations: iterations,
    };
}

export function genParseTable(g: Grammar, doneList: List<ItemSet>): { result: ParseTable, conflicts: Conflict[] }{
    var conflicts = [];
    function resolveSRConflict(set: ItemSet, shift: Item, reduce: Item){
        var token = g.tokens[shift.getShift()];
        if(token.assoc !== Assoc.UNDEFINED){
            var ruleP = reduce.rule.pr;
            if(ruleP !== -1){
                if(ruleP > token.pr){
                    return reduce;
                }
                else if(ruleP < token.pr){
                    return shift;
                }
                else {
                    if(token.assoc === Assoc.LEFT){
                        return reduce;
                    }
                    else if(token.assoc === Assoc.RIGHT){
                        return shift;
                    }
                    else if(token.assoc === Assoc.NON){
                        return Item.NULL;
                    }
                    else {
                        console.assert(false);
                    }
                }
            }
        }
        var cf = new Conflict();
        cf.type = ConflictType.SR;
        cf.set = set;
        cf.token = token;
        cf.used = shift;
        cf.discarded = reduce;
        conflicts.push(cf);
        return shift;
    }
    function resolveRRConflict(set,r1,r2,token){
        token = g.tokens[token];
        var used = r1.rule.index > r2.rule.index ? r2 : r1;
        var discarded = r1.rule.index > r2.rule.index ? r1 : r2;
        var cf = new Conflict();
        cf.type = ConflictType.RR;
        cf.set = set;
        cf.token = token;
        cf.used = used;
        cf.discarded = discarded;
        conflicts.push(cf);
        return used;
    }
    var ptable = new ParseTable(g,doneList.size);
    doneList.forEach(function(set){
        set.forEach(function(item){
            if(item.actionType === Action.SHIFT){
                var sItem = item.getShift();
                if(g.isToken(sItem)){
                    // do shift
                    var tindex = set.stateIndex * g.tokenCount + sItem;
                    var cItem = ptable.shift[tindex];
                    if(cItem !== null){
                        // shift-reduce conflict
                        if(cItem.actionType === Action.REDUCE){
                            ptable.shift[tindex] = resolveSRConflict(set,item,cItem);
                        }
                        else {
                            // shift-shift conflicts shouldnt occur
                            console.assert(cItem.shift === item.shift);
                        }
                    }
                    else {
                        ptable.shift[tindex] = item;
                    }
                }
                else {
                    // do goto
                    var tindex = set.stateIndex * g.nts.length + (-sItem - 1);
                    ptable.gotot[tindex] = item;
                }
            }
            else if(item.actionType === Action.REDUCE){
                for(var i = 0;i < g.tokenCount;i++){
                    if(item.lah.contains(i + 1)){
                        var index = set.stateIndex * g.tokenCount + i;
                        var cItem = ptable.shift[index];
                        if(cItem !== null){
                            if(cItem.actionType === Action.REDUCE){
                                ptable.shift[index] = resolveRRConflict(set,cItem,item,i);
                            }
                            else if(cItem.actionType === Action.SHIFT){
                                ptable.shift[index] = resolveSRConflict(set,cItem,item);
                            }
                        }
                        else {
                            ptable.shift[index] = item;
                        }
                    }
                }
            }
            else {
                console.assert(false);
            }
        });
    });

    return {
        result: ptable,
        conflicts: conflicts
    };
}