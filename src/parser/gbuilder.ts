import { Grammar,Rule, NtDef } from '../grammar/grammar';
import { File } from './file';
import { BitSet } from '../util/bitset';
import { TokenSet } from '../grammar/token-set';
import { Assoc, TokenDef } from '../grammar/token-entry';
import { CompilationError as E, JsccError, JsccWarning } from '../util/E';
import { Context } from '../util/context';
import { StateBuilder } from '../lexer/builder';
import { LexAction } from '../lexer/action';
import { Coroutine, CoroutineMgr } from '../util/coroutine';
import { Located } from '../util/located';

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
    private _ctx: Context = null;
    private _f: File = new File();
    private _g: Grammar = new Grammar();

    private _tokenNameTable: { [s: string]: TokenDef } = {};
    private _tokenAliasTable: { [s: string]: TokenDef[] } = {};

    private _ruleStack: Rule[] = [];
    private _sematicVar: Located<string> = null;

    private _ntTable: {[s: string]: NtDef} = {};
    // ntPlaceHolders: {[s: string]: RuleLoc[]} = {};
    private _requiringNt: CoroutineMgr<NtDef> = null;

    private _genIndex = 0;
    private _first = true;
    private _pr = 1;

    private _onCommit: (() => any)[] = [];
    private _onDone: (() => any)[] = [];

    lexBuilder: StateBuilder<LexAction[]>;
    
    private _pseudoTokens: { [tname: string]: PseudoToken } = {};

    private _top(){
        return this._ruleStack[this._ruleStack.length - 1];
    }
    private _splitAction(line: number){
        let saved = this._sematicVar;
        this._sematicVar = null;

        let t = this._top();
        let s = '@' + this._genIndex++;
        this.prepareRule(s, line);
        let gen = this._top();
        this.addAction(t.action);
        this.commitRule();
        t.action = null;
        this.addRuleItem(s, TokenRefType.NAME, line);
        let cela = this;

        this._sematicVar = saved;

        // copy imported variables from parent rule
        for(let vname in t.vars){
            let v = t.vars[vname];
            gen.usedVars[vname] = { val: v.val, line: v.line };
        }
        for(let vname in t.usedVars){
            let v = t.usedVars[vname];
            gen.usedVars[vname] = { val: v.val, line: v.line };
        }
    }
    err(msg: string, line: number){
        this._ctx.err(new E(msg, line));
    }
    defToken(name: string, alias: string, line: number): TokenDef{
        var tkdef = this._tokenNameTable[name];
        if(tkdef !== undefined){
            // this.err(`token "${name}" was already defined at line ${this.g.tokens[tkIndex].line}`, line);
            return tkdef;
        }
        else {
            tkdef = { 
                index: this._g.tokens.length,
                sym: name,
                alias: alias,
                line: line,
                pr: 0,
                assoc: Assoc.UNDEFINED,
                used: false
            };
            if(alias !== null){
                this._tokenAliasTable[alias] || (this._tokenAliasTable[alias] = []);
                this._tokenAliasTable[alias].push(tkdef);
            }
            this._tokenNameTable[name] = tkdef;
            this._g.tokens.push(tkdef);
            return tkdef;
        }
    }
    getTokenByAlias(a: string, line: number): TokenDef{
        let aa = this._tokenAliasTable[a];
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
        let ret = this._tokenNameTable[t];
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
                tk.pr = this._pr;
            }
        }
        else if(type === TokenRefType.STRING){
            let tk = this.getTokenByAlias(tid, line);
            if(tk !== null){
                tk.assoc = assoc;
                tk.pr = this._pr;
            }
        }
        else if(type === TokenRefType.NAME){
            let t2 = this._pseudoTokens[tid] = this._pseudoTokens[tid] || {
                assoc: assoc,
                pr: this._pr,
                line: line
            };
        }
    }
    setOpt(name: string, value: string): this{
        this._f.opt[name] = value;
        return this;
    }
    setHeader(h: string){
        this._f.header = h;
    }
    setExtraArg(a: string){
        this._f.extraArgs = a;
    }
    incPr(){
        this._pr++;
        return this;
    }
    prepareRule(lhs: string, line: number){
        if(this._first){
            this._first = false;
            this.prepareRule('(accept)', line);
            this.addRuleItem(lhs, TokenRefType.NAME, line);
            this.addRuleItem('EOF', TokenRefType.TOKEN, line);
            this.commitRule();
        }
        
        var nt = this._ntTable[lhs];
        if(nt === undefined){
            nt = this._ntTable[lhs] = {
                index: this._g.nts.length,
                sym: lhs,
                firstSet: null,
                used: false,
                rules: [],
                parents: []
            }
            this._g.nts.push(nt);
            this._requiringNt.signal(lhs, nt);
        }
        let nr = new Rule(this._g, nt, line);
        this._ruleStack.push(nr);

        return this;
    }
    addRuleUseVar(vname: string, line: number){
        let t = this._top();
        if(t.usedVars[vname] !== undefined){
            this.err(`re-use of sematic variable "${vname}"`, line);
        }
        else {
            t.usedVars[vname] = { line: line, val: 0 };
        }
    }
    addRuleSematicVar(vname: string, line: number){
        let t = this._top();
        if(t.usedVars[vname] !== undefined){
            this.err(`variable "${vname}" conflicts with imported variable defined at line ${t.usedVars[vname].line}`, line);
        }
        else if(t.vars[vname] !== undefined){
            this.err(`sematic variable "${vname}" is already defined at line ${t.vars[vname].line}`, line);
        }
        else {
            this._sematicVar = { line: line, val: vname };
        }
    }
    addRuleItem(id: string, type: TokenRefType, line: number){
        let t = this._top();
        if(t.action !== null){
            this._splitAction(line);
        }
        if(this._sematicVar !== null){
            t.vars[this._sematicVar.val] = { val: t.rhs.length, line: this._sematicVar.line };
            this._sematicVar = null;
        }
        if(type === TokenRefType.NAME){
            let cela = this;
            let pos = t.rhs.length;
            t.rhs.push(0);
            this._requiringNt.wait(id, (su, nt) => {
                if(su){
                    t.rhs[pos] = -nt.index - 1;
                    nt.parents.push({
                        rule: t,
                        pos: pos
                    });
                    nt.used = true;
                }
                else {
                    cela.err(`use of undefined non terminal ${id}`, line);                    
                }
            });
        }
        else if(type === TokenRefType.TOKEN){
            let tl = this._tokenNameTable[id];
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
        if(this._sematicVar !== null){
            t.vars[this._sematicVar.val] = { val: t.rhs.length, line: this._sematicVar.line };
            this._sematicVar = null;
            this._splitAction(t.line);
        }
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
            var pt = this._pseudoTokens[token];
            if(!pt){
                this.err(`pseudo token "${token}" is not defined`,line);
            }
            this._top().pr = pt.pr;
        }
    }
    commitRule(){
        var t = this._ruleStack.pop();
        t.index = this._g.rules.length;
        t.lhs.rules.push(t);
        this._g.rules.push(t);
        for(let cb of this._onCommit){
            cb();
        }
        this._onCommit.length = 0;
        return this;
    }
    build(){
        this._g.tokenCount = this._g.tokens.length;
        this._g.tokens[0].used = true;// end of file
        this._g.nts[0].used = true;// (accept)
        let cela = this;

        for(let nt of this._g.nts){
            nt.firstSet = new TokenSet(this._g.tokenCount);
            for(let rule of nt.rules){
                rule.calcPr();
                for(let vname in rule.usedVars){
                    let v = rule.usedVars[vname];
                    v.val = rule.getVarSp(vname, msg => {
                        cela.err(`cannot find variable "${vname}": ${msg}`, v.line);
                    });
                }
            }
        }
        this._f.lexDFA = this.lexBuilder.build();

        for(let cb of this._onDone){
            cb();
        }
        this._requiringNt.fail();
        return this._f;
    }

    constructor(ctx: Context){
        let cela = this;
        this._f.grammar = this._g;
        this._ctx = ctx;
        this.lexBuilder = new StateBuilder<LexAction[]>(ctx);
        this._requiringNt = new CoroutineMgr<NtDef>(s => {
            return cela._ntTable[s];
        });

        this.defToken('EOF', null, 0);
    }
}
