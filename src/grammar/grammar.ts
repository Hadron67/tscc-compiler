import { TokenSet } from './token-set';
import { TokenDef, TokenEntry, Assoc, convertTokenToString } from './token-entry'
import { LexAction } from '../lexer/action';

export interface NtDef{
    index: number,
    sym: string,
    firstSet: TokenSet,
    used: boolean,
    rules: Rule[],
    parents: { rule: Rule, pos: number }[];
}

export class Rule {
    public pr: number = -1;
    public rhs: number[] = [];
    public action: LexAction[] = null;
    public index = 0;
    public vars: { [s: string]: number } = null;
    public usedVars: string[] = [];
    constructor(
        public g: Grammar, 
        public lhs: NtDef,
        public line: number 
    ){}

    calcPr(){
        if(this.pr === -1){
            for(let i = this.rhs.length - 1; i >= 0; i--){
                let item = this.rhs[i];
                if(item >= 0){
                    this.g.tokens[item].assoc !== Assoc.UNDEFINED && 
                    (this.pr = this.g.tokens[item].pr);
                }
            }
        }
    }
    public toString(marker?: number){
        var ret = this.index + ': ' + this.lhs.sym + ' =>';
        for(var i = 0;i < this.rhs.length;i++){
            var r = this.rhs[i];
            if(marker === i){
                ret += ' .';
            }
            if(r >= 0){
                // ret += ' <' + this.g.tokens[r].sym + '>';
                ret += ' ' + convertTokenToString(this.g.tokens[r]);
            }
            else {
                ret += ' ' + this.g.nts[-r - 1].sym;
            }
        }
        if(marker === this.rhs.length){
            ret += ' .';
        }
        return ret;
    }
}

export class Grammar implements TokenEntry{
    public tokens: TokenDef[] = [];
    public tokenCount: number = 0;
    public nts: NtDef[] = [];
    public rules: Rule[] = [];

    isToken(t: number): boolean{
        return t >= 0;
    }

    forEachRule(cb: (index: number, rule: Rule) => void): void{
        for(var i = 0;i < this.nts.length;i++){
            var rules = this.nts[i].rules;
            for(var j = 0;j < rules.length;j++){
                cb(i,rules[j]);
            }
        }
    }
    forEachRuleOfNt(lhs: number, cb: (rule: Rule) => boolean): void{
        var rules = this.nts[lhs].rules;
        for(var j = 0;j < rules.length;j++){
            if(cb(rules[j])){
                break;
            }
        }
    }
    genFirstSets(): void{
        var changed = true;
        while(changed){
            changed = false;
            // iterate for each non terminal
            for(var i = 0;i < this.nts.length;i++){
                var rules = this.nts[i].rules;
                var firstSet = this.nts[i].firstSet;
                for(var j = 0;j < rules.length;j++){
                    var rule = rules[j];
                    if(rule.rhs.length === 0){
                        changed = firstSet.add(0) || changed;
                    }
                    else {
                        for(var k = 0;k < rule.rhs.length;k++){
                            var ritem = rule.rhs[k];
                            if(this.isToken(ritem)){
                                changed = firstSet.add(ritem + 1) || changed;
                                break;
                            }
                            else {
                                if(i !== ritem){
                                    changed = firstSet.union(this.nts[-ritem - 1].firstSet) || changed;
                                }
                                if(!firstSet.contains(0)){
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    toString(opt: { endl?: string, escape?: boolean, firstSets?: boolean } = {}){
        opt = opt || {};
        var endl = opt.endl || endl;
        var escape = opt.escape || false;
        var ret = '';
        this.forEachRule((lhs, rule) => {
            var s = rule.toString();
            ret += s + endl;
        });
        if(opt.firstSets){
            for(var i = 0;i < this.nts.length;i++){
                var s = this.nts[i];
                ret += `First(${s.sym}) = { ${s.firstSet.toString(this)} }${endl}`;
            }
        }
        if(escape){
            ret = ret.replace(/</g,'&lt;').replace(/>/g,'&gt;');
        }
        return ret.replace(/\n/g,endl);
    }
    findTokenByName(t: string): TokenDef{
        for(let tk of this.tokens){
            if(tk.sym === t){
                return tk;
            }
        }
        return null;
    }
    findTokensByAlias(t: string): TokenDef[]{
        let ret: TokenDef[] = [];
        for(let tk of this.tokens){
            tk.alias === t && ret.push(tk);
        }
        return ret;
    }
}
