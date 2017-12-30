import { Grammar,Rule } from '../grammar/grammar';
import { File } from './file';
import { BitSet } from '../util/bitset';
import { TokenSet } from '../grammar/token-set';
import { Assoc, TokenDef } from '../grammar/token-entry';
import { CompilationError as E } from '../util/E';

export enum TokenDefType{
    TOKEN = 0,// using %token
    LEFT = 1,// using %left
    RIGHT = 2,// using %right
    NON_ASSOC = 3,// using %nonassoc
    IMPLICIT = 4// direct use in lexical rules or grammar rules
};

interface TokenRawDef{
    index: number;
    alias: string;
    pr: number;
    assoc: Assoc;

    line: number;
}

interface RawRuleItem{
    id: string;
    isTerm: boolean;
    line: number;
}

interface RawRule {
    lhs: string;
    pr: number;
    action: string;
    rhs: RawRuleItem[];
    line: number;
    vars: {[vname: string]: string};
}

interface PseudoToken{
    assoc: Assoc;
    pr: number;
    line: number;
}

export class GBuilder{
    f: File = new File();
    g: Grammar = new Grammar();

    tokenCount = 0;
    tokens: { [s: string]: TokenRawDef } = {};
    rules: RawRule[] = [];
    ruleStack: RawRule[] = [];

    ntCount = 0;
    nts: {[s: string]: number} = {};

    genIndex = 0;
    first = true;
    pr = 1;

    states: {[s: string]: number} = { DEFAULT: 0 };
    stateCount = 1;
    stateNum = 0;

    selectedStates: number[] = [];
    
    pseudoTokens: { [tname: string]: PseudoToken } = {};

    private top(){
        return this.ruleStack[this.ruleStack.length - 1];
    }
    private splitAction(line: number){
        var t = this.top();
        var s = '@' + this.genIndex++;
        this.prepareRule(s, line);
        this.addAction(t.action);
        this.commitRule();
        t.action = null;
        this.addRuleItem(s,false,line);
    }
    
    defToken(name: string, alias: string, line: number){
        var tk = this.tokens[name];
        if(tk){
            throw new E('token "' + name + '"' + ' was already defined at line ' + tk.line,line);
        }
        else {
            tk = this.tokens[name] = { 
                index: this.tokenCount++,
                alias: alias,
                line: line,
                pr: 0,
                assoc: Assoc.UNDEFINED,
            };
        }
        return this;
    }

    addRegExp(){

    }
    defineTokenPrec(tid : string, assoc: Assoc, pseudo: boolean, line: number): this{
        if(!pseudo){
            var t = this.tokens[tid];
            if(!t){
                throw new E('use of undefined token "' + tid + '" in associativity defination',line);
            }
            t.assoc = assoc;
            t.pr = this.pr;
        }
        else {
            var t2 = this.pseudoTokens[tid] = this.pseudoTokens[tid] || {
                assoc: assoc,
                pr: this.pr,
                line: line
            };
        }
        return this;
    }
    setOpt(name: string, value: string): this{
        this.f.opt[name] = value;
        return this;
    }
    incPr(){
        this.pr++;
        return this;
    }
    changeState(s: string){
        var sn = this.states[s];
        if(!sn){
            sn = this.states[s] = this.stateCount++;
        }
        this.stateNum = sn;
        return this;
    }
    prepareRule(lhs: string, line: number){
        if(this.first){
            this.first = false;
            this.prepareRule('(accept)',line);
            this.addRuleItem(lhs,false,line);
            this.commitRule();
        }
        
        this.ruleStack.push({ 
            lhs: lhs,
            action: null,
            rhs:[],
            line: line,
            pr: -1,
            vars: {}
        });
        if(this.nts[lhs] === undefined){
            this.nts[lhs] = this.ntCount++;
        }
        return this;
    }
    addRuleItem(id: string, isTerm: boolean, line: number){
        var t = this.top();
        if(t.action !== null){
            this.splitAction(line);
        }
        t.rhs.push({ id: id,isTerm: isTerm,line: line });
        return this;
    }
    addAction(b: string){
        var t = this.top();
        if(t.action !== null){
            this.splitAction(t.line);
        }
        t.action = b;
        return this;
    }
    defineRulePr(token: string, pseudo: boolean, line: number){
        if(!pseudo){
            var t = this.tokens[token];
            if(!t){
                throw new E('use of undefined token "' + token + '" in rule priority defination',line);
            }
            if(t.assoc === Assoc.UNDEFINED){
                throw new E('precedence of token "' + token + '" has not been defined',line);
            }
            this.top().pr = t.pr;
        }
        else {
            var pt = this.pseudoTokens[token];
            if(!pt){
                throw new E('pseudo token "' + token + '" is not defined',line);
            }
            this.top().pr = pt.pr;
        }
        
        return this;
    }
    commitRule(){
        var t = this.ruleStack.pop();
        this.rules[t.lhs] || (this.rules[t.lhs] = []);
        this.rules.push(t);
        return this;
    }
    build(){
        this.g.tokenCount = this.tokenCount;

        this.g.tokens = new Array(this.tokenCount);
        this.g.nts = new Array(this.ntCount);
        for(var tk in this.tokens){
            var index = this.tokens[tk].index;
            this.g.tokens[index] = { 
                sym: tk,
                alias: this.tokens[tk].alias,
                line: this.tokens[tk].line,
                pr: this.tokens[tk].pr,
                assoc: this.tokens[tk].assoc,
                used: false
            };
        }
        for(var nt in this.nts){
            this.g.nts[this.nts[nt]] = { 
                sym: nt,
                firstSet: new TokenSet(this.tokenCount),
                used: false
            };
        }
        this.g.tokens[0].used = true;
        this.g.nts[0].used = true;

        var r = new Array(this.ntCount);
        var ruleCount = 0;
        for(var i = 0;i < this.rules.length;i++){
            var ruleItems = [];
            var rule = this.rules[i];
            var ntsIndex = this.nts[rule.lhs];

            r[ntsIndex] || (r[ntsIndex] = []);
            var newRule = new Rule(this.g,ntsIndex,rule.action,ruleItems,ruleCount++,rule.line);
            newRule.pr = rule.pr;
            r[ntsIndex].push(newRule);
            for(var j = 0;j < rule.rhs.length;j++){
                var it = rule.rhs[j];
                var rulePr = -1;
                if(it.isTerm){
                    var tkEntry = this.tokens[it.id];
                    if(tkEntry === undefined){
                        throw new E('use of undefined token "' + it.id + '"',it.line);
                    }
                    var termIndex = tkEntry.index;
                    ruleItems.push(tkEntry.index);
                    this.g.tokens[termIndex].used = true;
                    if(tkEntry.assoc !== Assoc.UNDEFINED){
                        rulePr = tkEntry.pr;
                    }
                }
                else {
                    var ntIndex = this.nts[it.id];
                    if(ntIndex === undefined){
                        throw new E('use of undefined non terminal "' + it.id + '"',it.line);
                    }
                    ruleItems.push(ntIndex + this.tokenCount);
                    //g.sym[ntIndex + tokenCount].used = true;
                    this.g.nts[ntIndex].used = true;
                }
                if(newRule.pr === -1 && rulePr !== -1){
                    newRule.pr = rulePr;
                }
            }
        }
        this.g.rules = r;
        return this.f;
    }

    constructor(){
        this.f.grammar = this.g;
        this.defToken('eof', '', 0);
    }
}
