import { Grammar,Rule, NtDef } from '../grammar/grammar';
import { File } from './file';
import { BitSet } from '../util/bitset';
import { TokenSet } from '../grammar/token-set';
import { Assoc, TokenDef } from '../grammar/token-entry';
import { CompilationError as E, JsccError, JsccWarning, CompilationError } from '../util/E';
import { Context } from '../util/context';
import { LexBuilder, createLexBuilder } from '../lexer/builder';
import { LexAction, pushState } from '../lexer/action';
import { Coroutine, CoroutineMgr } from '../util/coroutine';
import { Located } from '../util/located';
import { JNode } from './node';

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

export interface GBuilder{
    err(msg: string, line: number);
    defToken(name: string, alias: string, line: number): TokenDef;
    getTokenByAlias(a: string, line: number): TokenDef;
    getTokenByName(t: string, line: number): TokenDef;
    defineTokenPrec(tid: string, assoc: Assoc, type: TokenRefType, line: number);
    setOpt(name: string, value: string);
    setHeader(h: string);
    setExtraArg(a: string);
    setType(t: string);
    setInit(arg: string, body: string);
    setEpilogue(ep: JNode);
    incPr();
    prepareRule(lhs: string, line: number);
    addRuleUseVar(vname: string, line: number);
    addRuleSematicVar(vname: string, line: number);
    addRuleItem(id: string, type: TokenRefType, line: number);
    addAction(b: LexAction[]);
    defineRulePr(token: string, type: TokenRefType, line: number);
    commitRule();
    addPushStateAction(acts: LexAction[], vn: string, line: number);
    build();
    readonly lexBuilder: LexBuilder<LexAction[]>;
}

export function createFileBuilder(ctx: Context): GBuilder{
    let _f: File = new File();
    let _g: Grammar = new Grammar();

    let _tokenNameTable: { [s: string]: TokenDef } = {};
    let _tokenAliasTable: { [s: string]: TokenDef[] } = {};

    let _ruleStack: Rule[] = [];
    let _sematicVar: Located<string> = null;

    let _ntTable: {[s: string]: NtDef} = {};
    // ntPlaceHolders: {[s: string]: RuleLoc[]} = {};
    let _requiringNt: CoroutineMgr<NtDef> = null;

    let _genIndex = 0;
    let _first = true;
    let _pr = 1;
    let _onCommit: (() => any)[] = [];
    let _onDone: (() => any)[] = [];
    let lexBuilder: LexBuilder<LexAction[]>;
    let _pseudoTokens: { [tname: string]: PseudoToken } = {};

    _f.grammar = _g;
    lexBuilder = createLexBuilder(ctx);
    _requiringNt = new CoroutineMgr<NtDef>(s => _ntTable[s]);
    defToken('EOF', null, 0);

    return {
        err,
        defToken,
        getTokenByAlias,
        getTokenByName,
        defineTokenPrec,
        setOpt,
        setHeader,
        setExtraArg,
        setType,
        setInit,
        setEpilogue,
        incPr,
        prepareRule,
        addRuleUseVar,
        addRuleSematicVar,
        addRuleItem,
        addAction,
        defineRulePr,
        commitRule,
        addPushStateAction,
        build,
        lexBuilder: lexBuilder
    };

    function _top(){
        return _ruleStack[_ruleStack.length - 1];
    }
    function _splitAction(line: number){
        let saved = _sematicVar;
        _sematicVar = null;

        let t = _top();
        let s = '@' + _genIndex++;
        prepareRule(s, line);
        let gen = _top();
        addAction(t.action);
        commitRule();
        t.action = null;
        addRuleItem(s, TokenRefType.NAME, line);

        _sematicVar = saved;

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
    function err(msg: string, line: number){
        ctx.err(new E(msg, line));
    }
    function defToken(name: string, alias: string, line: number): TokenDef{
        var tkdef = _tokenNameTable[name];
        if(tkdef !== undefined){
            return tkdef;
        }
        else {
            tkdef = { 
                index: _g.tokens.length,
                sym: name,
                alias: alias,
                line: line,
                pr: 0,
                assoc: Assoc.UNDEFINED,
                used: false
            };
            if(alias !== null){
                _tokenAliasTable[alias] || (_tokenAliasTable[alias] = []);
                _tokenAliasTable[alias].push(tkdef);
            }
            _tokenNameTable[name] = tkdef;
            _g.tokens.push(tkdef);
            return tkdef;
        }
    }
    function getTokenByAlias(a: string, line: number): TokenDef{
        let aa = _tokenAliasTable[a];
        if(aa === undefined){
            err(`cannot identify "${a}" as a token`, line);
            return null;
        }
        else if(aa.length > 1){
            let ret = '';
            for(let i = 0;i < aa.length;i++){
                i > 0 && (ret += ',');
                ret += `<${aa[i].sym}>`;
            }
            err(`cannot identify ${a} as a token, since it could be ${ret}`, line);
            return null;
        }
        return aa[0];
    }
    function getTokenByName(t: string, line: number): TokenDef{
        let ret = _tokenNameTable[t];
        if(ret === undefined){
            err(`cannot identify <${t}> as a token`, line);
            return null;
        }
        return ret;
    }
    function defineTokenPrec(tid: string, assoc: Assoc, type: TokenRefType, line: number){
        if(type === TokenRefType.TOKEN){
            let tk = getTokenByName(tid, line);
            if(tk !== null){
                tk.assoc = assoc;
                tk.pr = _pr;
            }
        }
        else if(type === TokenRefType.STRING){
            let tk = getTokenByAlias(tid, line);
            if(tk !== null){
                tk.assoc = assoc;
                tk.pr = _pr;
            }
        }
        else if(type === TokenRefType.NAME){
            let t2 = _pseudoTokens[tid] = _pseudoTokens[tid] || {
                assoc: assoc,
                pr: _pr,
                line: line
            };
        }
    }
    function setOpt(name: string, value: string){
        _f.opt[name] = value;
    }
    function setHeader(h: string){
        _f.header = h;
    }
    function setExtraArg(a: string){
        _f.extraArgs = a;
    }
    function setType(t: string){
        _f.sematicType = t;
    }
    function setInit(arg: string, body: string){
        _f.initArg = arg;
        _f.initBody = body;
    }
    function incPr(){
        _pr++;
    }
    function setEpilogue(ep: JNode){
        _f.epilogue = ep;
    }
    function prepareRule(lhs: string, line: number){
        if(_first){
            _first = false;
            prepareRule('(accept)', line);
            addRuleItem(lhs, TokenRefType.NAME, line);
            addRuleItem('EOF', TokenRefType.TOKEN, line);
            commitRule();
        }
        
        var nt = _ntTable[lhs];
        if(nt === undefined){
            nt = _ntTable[lhs] = {
                index: _g.nts.length,
                sym: lhs,
                firstSet: null,
                used: false,
                rules: [],
                parents: []
            }
            _g.nts.push(nt);
            _requiringNt.signal(lhs, nt);
        }
        let nr = new Rule(_g, nt, line);
        _ruleStack.push(nr);
    }
    function addRuleUseVar(vname: string, line: number){
        let t = _top();
        if(t.usedVars[vname] !== undefined){
            err(`re-use of sematic variable "${vname}"`, line);
        }
        else {
            t.usedVars[vname] = { line: line, val: 0 };
        }
    }
    function addRuleSematicVar(vname: string, line: number){
        let t = _top();
        if(t.usedVars[vname] !== undefined){
            err(`variable "${vname}" conflicts with imported variable defined at line ${t.usedVars[vname].line}`, line);
        }
        else if(t.vars[vname] !== undefined){
            err(`sematic variable "${vname}" is already defined at line ${t.vars[vname].line}`, line);
        }
        else {
            _sematicVar = { line: line, val: vname };
        }
    }
    function addRuleItem(id: string, type: TokenRefType, line: number){
        let t = _top();
        if(t.action !== null){
            _splitAction(line);
        }
        if(_sematicVar !== null){
            t.vars[_sematicVar.val] = { val: t.rhs.length, line: _sematicVar.line };
            _sematicVar = null;
        }
        if(type === TokenRefType.NAME){
            let pos = t.rhs.length;
            t.rhs.push(0);
            _requiringNt.wait(id, (su, nt) => {
                if(su){
                    t.rhs[pos] = -nt.index - 1;
                    nt.parents.push({
                        rule: t,
                        pos: pos
                    });
                    nt.used = true;
                }
                else {
                    err(`use of undefined non terminal ${id}`, line);                    
                }
            });
        }
        else if(type === TokenRefType.TOKEN){
            let tl = _tokenNameTable[id];
            if(tl === undefined){
                err(`cannot recognize <${id}> as a token`, line);
                return;
            }
            t.rhs.push(tl.index);
            tl.used = true;
        }
        else if(type === TokenRefType.STRING){
            let td = getTokenByAlias(id, line);
            if(td !== null){
                t.rhs.push(td.index);
                td.used = true;
            }
        }
    }
    function addAction(b: LexAction[]){
        var t = _top();
        if(t.action !== null){
            _splitAction(t.line);
        }
        t.action = b;
        if(_sematicVar !== null){
            t.vars[_sematicVar.val] = { val: t.rhs.length, line: _sematicVar.line };
            _sematicVar = null;
            _splitAction(t.line);
        }
    }
    function defineRulePr(token: string, type: TokenRefType, line: number){
        if(type === TokenRefType.STRING || type === TokenRefType.TOKEN){
            let tk: TokenDef = type === TokenRefType.STRING ? 
                getTokenByAlias(token, line) : 
                getTokenByName(token, line);
            if(tk !== null){
                if(tk.assoc === Assoc.UNDEFINED){
                    err(`precedence of token "${token}" has not been defined`,line);
                    return;
                }
                _top().pr = tk.pr;
            }
        }
        else {
            var pt = _pseudoTokens[token];
            if(!pt){
                err(`pseudo token "${token}" is not defined`,line);
            }
            _top().pr = pt.pr;
        }
    }
    function commitRule(){
        var t = _ruleStack.pop();
        t.index = _g.rules.length;
        t.lhs.rules.push(t);
        _g.rules.push(t);
        for(let cb of _onCommit){
            cb();
        }
        _onCommit.length = 0;
    }
    function addPushStateAction(acts: LexAction[], vn: string, line: number){
        lexBuilder.requiringState.wait(vn, (su, sn) => {
            if(su){
                acts.push(pushState(sn));
            }
            else {
                ctx.err(new CompilationError(`state "${vn}" is undefined`, line));
            }
        });
    }
    function build(){
        _g.tokenCount = _g.tokens.length;
        _g.tokens[0].used = true;// end of file
        _g.nts[0].used = true;// (accept)

        for(let nt of _g.nts){
            nt.firstSet = new TokenSet(_g.tokenCount);
            for(let rule of nt.rules){
                rule.calcPr();
                for(let vname in rule.usedVars){
                    let v = rule.usedVars[vname];
                    v.val = rule.getVarSp(vname, msg => {
                        err(`cannot find variable "${vname}": ${msg}`, v.line);
                    });
                }
            }
        }
        _f.lexDFA = lexBuilder.build();

        for(let cb of _onDone){
            cb();
        }
        _requiringNt.fail();
        return _f;
    }

    
}
