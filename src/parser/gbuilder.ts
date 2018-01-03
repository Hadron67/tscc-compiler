import { Grammar,Rule } from '../grammar/grammar';
import { File } from './file';
import { BitSet } from '../util/bitset';
import { TokenSet } from '../grammar/token-set';
import { Assoc, TokenDef } from '../grammar/token-entry';
import { CompilationError as E, JsccError } from '../util/E';
import { Context } from '../util/context';
import { StateBuilder } from '../lexer/builder';
import { LexAction } from '../lexer/action';
import { Coroutine } from '../util/coroutine';

interface NtPlaceHolder{
    nt: number;
    rItem: number;
};

interface RuleLoc{
    rule: Rule;
    pos: number;
    line: number;
};

export enum TokenRefType {
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

    tokenNameTable: { [s: string]: TokenDef } = {};
    tokenAliasTable: { [s: string]: TokenDef[] } = {};

    ruleStack: Rule[] = [];

    ruleCount = 0;
    ntTable: {[s: string]: number} = {};
    // ntPlaceHolders: {[s: string]: RuleLoc[]} = {};
    requiringNt: {[s: string]: Coroutine<number>[]} = {};

    genIndex = 0;
    first = true;
    pr = 1;

    lexBuilder: StateBuilder<LexAction[]>;
    
    pseudoTokens: { [tname: string]: PseudoToken } = {};

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
        this.addRuleItem(s,TokenRefType.NAME,line);
    }
    err(msg: string, line: number){
        this.ctx.err(new E(msg, line));
    }
    defToken(name: string, alias: string, line: number): TokenDef{
        var tkdef = this.tokenNameTable[name];
        if(tkdef !== undefined){
            // this.err(`token "${name}" was already defined at line ${this.g.tokens[tkIndex].line}`, line);
            return tkdef;
        }
        else {
            tkdef = { 
                index: this.g.tokens.length,
                sym: name,
                alias: alias,
                line: line,
                pr: 0,
                assoc: Assoc.UNDEFINED,
                used: false
            };
            if(alias !== null){
                this.tokenAliasTable[alias] || (this.tokenAliasTable[alias] = []);
                this.tokenAliasTable[alias].push(tkdef);
            }
            this.tokenNameTable[name] = tkdef;
            this.g.tokens.push(tkdef);
            return tkdef;
        }
        // return this;
    }
    getTokenByAlias(a: string, line: number): TokenDef{
        let aa = this.tokenAliasTable[a];
        if(aa === undefined){
            this.err(`cannot identify "${a}" as a token`, line);
            return null;
        }
        else if(aa.length > 1){
            let ret = '';
            for(let i = 0;i < aa.length;i++){
                i > 0 && (ret += ',');
                ret += `<${aa[i].sym}>`;
            }
            this.err(`cannot identify ${a} as a token, since it could be ${ret}`, line);
            return null;
        }
        return aa[0];
    }
    getTokenByName(t: string, line: number): TokenDef{
        let ret = this.tokenNameTable[t];
        if(ret === undefined){
            this.err(`cannot identify <${t}> as a token`, line);
            return null;
        }
        return ret;
    }
    defineTokenPrec(tid: string, assoc: Assoc, type: TokenRefType, line: number){
        if(type === TokenRefType.TOKEN){
            let tk = this.getTokenByName(tid, line);
            if(tk !== null){
                tk.assoc = assoc;
                tk.pr = this.pr;
            }
        }
        else if(type === TokenRefType.STRING){
            let tk = this.getTokenByAlias(tid, line);
            if(tk !== null){
                tk.assoc = assoc;
                tk.pr = this.pr;
            }
        }
        else if(type === TokenRefType.NAME){
            let t2 = this.pseudoTokens[tid] = this.pseudoTokens[tid] || {
                assoc: assoc,
                pr: this.pr,
                line: line
            };
        }
    }
    setOpt(name: string, value: string): this{
        this.f.opt[name] = value;
        return this;
    }
    incPr(){
        this.pr++;
        return this;
    }
    requireNt(ntname: string, cr: Coroutine<number>){
        let nt = this.ntTable[ntname];
        if(nt !== undefined){
            cr.run(nt);
        }
        else {
            this.requiringNt[ntname] || (this.requiringNt[ntname] = []);
            this.requiringNt[ntname].push(cr);
        }
    }
    prepareRule(lhs: string, line: number){
        if(this.first){
            this.first = false;
            this.prepareRule('(accept)',line);
            this.addRuleItem(lhs,TokenRefType.NAME,line);
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
            let crs = this.requiringNt[lhs];
            if(crs !== undefined){
                for(let cr of crs){
                    cr.run(lhsn);
                }
                delete this.requiringNt[lhs];
            }
        }
        let nr = new Rule(this.g, lhsn, null, [], this.ruleCount++, line);
        this.ruleStack.push(nr);

        return this;
    }
    addRuleItem(id: string, type: TokenRefType, line: number){
        let t = this._top();
        if(t.action !== null){
            this._splitAction(line);
        }

        if(type === TokenRefType.NAME){
            let cela = this;
            let pos = t.rhs.length;
            t.rhs.push(0);
            this.requireNt(id, {
                run(ntsIndex){
                    t.rhs[pos] = -ntsIndex - 1;
                    cela.g.nts[ntsIndex].used = true;
                },
                fail(){
                    cela.err(`use of undefined non terminal ${id}`, line);
                }
            });
        }
        else if(type === TokenRefType.TOKEN){
            let tl = this.tokenNameTable[id];
            if(tl === undefined){
                this.err(`cannot recognize <${id}> as a token`, line);
                return;
            }
            t.rhs.push(tl.index);
            tl.used = true;
        }
        else if(type === TokenRefType.STRING){
            let td = this.getTokenByAlias(id, line);
            if(td !== null){
                t.rhs.push(td.index);
                td.used = true;
            }
        }
    }
    addAction(b: LexAction[]){
        var t = this._top();
        if(t.action !== null){
            this._splitAction(t.line);
        }
        t.action = b;
        return this;
    }
    defineRulePr(token: string, type: TokenRefType, line: number){
        if(type === TokenRefType.STRING || type === TokenRefType.TOKEN){
            let tk: TokenDef = type === TokenRefType.STRING ? 
                this.getTokenByAlias(token, line) : 
                this.getTokenByName(token, line);
            if(tk !== null){
                if(tk.assoc === Assoc.UNDEFINED){
                    this.err(`precedence of token "${token}" has not been defined`,line);
                    return;
                }
                this._top().pr = tk.pr;
            }
        }
        else {
            var pt = this.pseudoTokens[token];
            if(!pt){
                this.err(`pseudo token "${token}" is not defined`,line);
            }
            this._top().pr = pt.pr;
        }
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
        for(let nnt in this.requiringNt){
            let crs = this.requiringNt[nnt];
            for(let cr of crs){
                cr.fail();
            }
        }

        this.f.lexDFA = this.lexBuilder.build();

        return this.f;
    }

    constructor(ctx: Context){
        this.f.grammar = this.g;
        this.ctx = ctx;
        this.lexBuilder = new StateBuilder<LexAction[]>(ctx);

        this.defToken('EOF', 'eof', 0);
    }
}
