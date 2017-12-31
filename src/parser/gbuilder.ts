import { Grammar,Rule } from '../grammar/grammar';
import { File } from './file';
import { BitSet } from '../util/bitset';
import { TokenSet } from '../grammar/token-set';
import { Assoc, TokenDef } from '../grammar/token-entry';
import { CompilationError as E, JsccError } from '../util/E';
import { Context } from '../util/context';

interface NtPlaceHolder{
    nt: number;
    rItem: number;
};

interface RuleLoc{
    rule: Rule;
    pos: number;
    line: number;
};

export enum RuleItemType {
    TOKEN = 0,
    STRING = 1,
    NAME = 2
};

interface PseudoToken{
    assoc: Assoc;
    pr: number;
    line: number;
}

export class GBuilder{
    ctx: Context = null;
    f: File = new File();
    g: Grammar = new Grammar();

    //tokens: { [s: string]: TokenRawDef } = {};
    tokenNameTable: { [s: string]: number } = {};
    tokenAliasTable: { [s: string]: number } = {};

    //rules: RawRule[] = [];
    ruleStack: Rule[] = [];

    //ntCount = 0;
    //nts: {[s: string]: number} = {};
    ruleCount = 0;
    ntTable: {[s: string]: number} = {};
    ntPlaceHolders: {[s: string]: RuleLoc[]} = {};

    genIndex = 0;
    first = true;
    pr = 1;

    states: {[s: string]: number} = { DEFAULT: 0 };
    stateCount = 1;
    stateNum = 0;

    selectedStates: number[] = [];
    
    pseudoTokens: { [tname: string]: PseudoToken } = {};

    errors: JsccError[] = [];

    private _top(){
        return this.ruleStack[this.ruleStack.length - 1];
    }
    private _splitAction(line: number){
        var t = this._top();
        var s = '@' + this.genIndex++;
        this.prepareRule(s, line);
        this.addAction(t.action);
        this.commitRule();
        t.action = null;
        this.addRuleItem(s,RuleItemType.NAME,line);
    }
    err(msg: string, line: number){
        this.ctx.err(new E(msg, line));
    }
    defToken(name: string, alias: string, line: number){
        var tkIndex = this.tokenNameTable[name];
        if(tkIndex !== undefined){
            //throw new E('token "' + name + '"' + ' was already defined at line ' + tk.line,line);
            this.err(`token "${name}" was already defined at line ${this.g.tokens[tkIndex].line}`, line);
            return this;
        }
        else {
            var tk: TokenDef = { 
                sym: name,
                alias: alias,
                line: line,
                pr: 0,
                assoc: Assoc.UNDEFINED,
                used: false
            };
            this.tokenNameTable[name] = this.g.tokens.length;
            this.g.tokens.push(tk);
        }
        return this;
    }

    addRegExp(){

    }
    defineTokenPrec(tid: string, assoc: Assoc, pseudo: boolean, line: number): this{
        if(!pseudo){
            var t = this.tokenNameTable[tid];
            if(t === undefined){
                this.err(`use of undefined token "${tid}" in associativity defination`,line);
                return this;
            }
            var tk = this.g.tokens[t];
            tk.assoc = assoc;
            tk.pr = this.pr;
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
            this.addRuleItem(lhs,RuleItemType.NAME,line);
            this.commitRule();
        }
        
        var lhsn = this.ntTable[lhs];
        if(lhsn === undefined){
            lhsn = this.ntTable[lhs] = this.g.nts.length;
            this.g.nts.push({
                sym: lhs,
                firstSet: null,
                used: false,
                rules: []
            });
            var holders = this.ntPlaceHolders[lhs];
            if(holders){
                for(var holder of holders){
                    holder.rule.rhs[holder.pos] = -lhsn - 1;
                }
                delete this.ntPlaceHolders[lhs];
                this.g.nts[lhsn].used = true;
            }
        }
        var nr = new Rule(this.g, lhsn, null, [], this.ruleCount++, line);
        //this.g.nts[lhsn].rules.push(nr);
        this.ruleStack.push(nr);

        return this;
    }
    addRuleItem(id: string, type: RuleItemType, line: number){
        var t = this._top();
        if(t.action !== null){
            this._splitAction(line);
        }

        if(type === RuleItemType.NAME){
            let ntsIndex = this.ntTable[id];
            if(ntsIndex !== undefined){
                t.rhs.push(-ntsIndex - 1);
                this.g.nts[ntsIndex].used = true;
            }
            else {
                this.ntPlaceHolders[id] || (this.ntPlaceHolders[id] = []);
                this.ntPlaceHolders[id].push({
                    rule: t,
                    pos: t.rhs.length,
                    line: line
                });
                t.rhs.push(0);
            }
        }
        else if(type === RuleItemType.STRING){
            let tl = this.tokenNameTable[id];
            if(tl === undefined){
                this.err(`cannot recognize "${id}" as a token`, line);
                return this;
            }
            t.rhs.push(tl);
            this.g.tokens[tl].used = true;
        }

        return this;
    }
    addAction(b: string){
        var t = this._top();
        if(t.action !== null){
            this._splitAction(t.line);
        }
        t.action = b;
        return this;
    }
    defineRulePr(token: string, pseudo: boolean, line: number){
        if(!pseudo){
            var t = this.tokenNameTable[token];
            if(!t){
                this.err(`use of undefined token "${token}" in rule priority defination`,line);
                return this;
            }
            var tk = this.g.tokens[t];
            if(tk.assoc === Assoc.UNDEFINED){
                this.err(`precedence of token "${token}" has not been defined`,line);
                return this;
            }
            this._top().pr = tk.pr;
        }
        else {
            var pt = this.pseudoTokens[token];
            if(!pt){
                this.err(`pseudo token "${token}" is not defined`,line);
                return this;
            }
            this._top().pr = pt.pr;
        }
        
        return this;
    }
    commitRule(){
        var t = this.ruleStack.pop();
        this.g.nts[t.lhs].rules.push(t);
        return this;
    }
    build(){
        this.g.tokenCount = this.g.tokens.length;
        this.g.tokens[0].used = true;
        this.g.nts[0].used = true;

        for(let nt of this.g.nts){
            nt.firstSet = new TokenSet(this.g.tokenCount);
            for(let rule of nt.rules){
                rule.calcPr();
            }
        }

        var ruleCount = 0;
        for(let nnt in this.ntPlaceHolders){
            let holders = this.ntPlaceHolders[nnt];
            for(let holder of holders){
                this.err(`use of undefined non terminal "${nnt}"`, holder.line);
            }
            // return this;
        }

        return this.f;
    }
    hasError(){
        return this.errors.length > 0;
    }

    constructor(ctx: Context){
        this.f.grammar = this.g;
        this.ctx = ctx;
        this.defToken('eof', '', 0);
    }
}
