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
import { JNode, newNode, markPosition, Position, posToString } from './node';
import { endl } from '../util/io';

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
    pos: Position;
}

export interface GBuilder{
    err(msg: string, line: number);
    defToken(name: JNode, alias: string): TokenDef;
    getTokenByAlias(a: JNode): TokenDef;
    getTokenByName(t: JNode): TokenDef;
    defineTokenPrec(tid: JNode, assoc: Assoc, type: TokenRefType);
    setOpt(name: JNode, value: JNode);
    setOutput(n: JNode);
    setHeader(h: JNode);
    setExtraArg(a: JNode);
    setType(t: JNode);
    setInit(arg: JNode, body: JNode);
    setEpilogue(ep: JNode);
    incPr();
    prepareRule(lhs: JNode);
    addRuleUseVar(vname: JNode);
    addRuleSematicVar(vname: JNode);
    addRuleItem(id: JNode, type: TokenRefType);
    addAction(b: LexAction[]);
    defineRulePr(token: JNode, type: TokenRefType);
    commitRule();
    addPushStateAction(acts: LexAction[], vn: JNode);
    build();
    readonly lexBuilder: LexBuilder<LexAction[]>;
}

export function createFileBuilder(ctx: Context): GBuilder{
    let _f: File = new File();
    let _g: Grammar = new Grammar();

    let _tokenNameTable: { [s: string]: TokenDef } = {};
    let _tokenAliasTable: { [s: string]: TokenDef[] } = {};

    let _ruleStack: Rule[] = [];
    let _sematicVar: JNode = null;

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
    defToken(newNode('EOF'), null);

    return {
        err,
        defToken,
        getTokenByAlias,
        getTokenByName,
        defineTokenPrec,
        setOpt,
        setOutput,
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
    function _splitAction(){
        let saved = _sematicVar;
        _sematicVar = null;

        let t = _top();
        let s = '@' + _genIndex++;
        prepareRule(newNode(s));
        let gen = _top();
        addAction(t.action);
        commitRule();
        t.action = null;
        addRuleItem(newNode(s), TokenRefType.NAME);

        _sematicVar = saved;

        // copy imported variables from parent rule
        for(let vname in t.vars){
            let v = t.vars[vname];
            gen.usedVars[vname] = { val: v.val, pos: v.pos };
        }
        for(let vname in t.usedVars){
            let v = t.usedVars[vname];
            gen.usedVars[vname] = { val: v.val, pos: v.pos };
        }
    }
    function err(msg: string, line: number){
        ctx.err(new E(msg, line));
    }
    function singlePosErr(msg: string, pos: Position){
        ctx.requireLines((ctx, lines) => {
            ctx.err(new JsccError(msg + ' ' + markPosition(pos, lines), 'CompilationError'));
        });
    }
    function singlePosWarn(msg: string, pos: Position){
        ctx.requireLines((ctx, lines) => {
            ctx.warn(new JsccError(msg + ' ' + markPosition(pos, lines), 'Warning'));
        });
    }
    function defToken(name: JNode, alias: string): TokenDef{
        var tkdef = _tokenNameTable[name.val];
        if(tkdef !== undefined){
            tkdef.appears.push(name);
            return tkdef;
        }
        else {
            tkdef = { 
                index: _g.tokens.length,
                sym: name.val,
                alias: alias,
                pr: 0,
                assoc: Assoc.UNDEFINED,
                used: false,
                appears: [name]
            };
            if(alias !== null){
                _tokenAliasTable[alias] || (_tokenAliasTable[alias] = []);
                _tokenAliasTable[alias].push(tkdef);
            }
            _tokenNameTable[name.val] = tkdef;
            _g.tokens.push(tkdef);
            return tkdef;
        }
    }
    function getTokenByAlias(a: JNode): TokenDef{
        let aa = _tokenAliasTable[a.val];
        if(aa === undefined){
            singlePosErr(`cannot identify "${a.val}" as a token`, a);
            return null;
        }
        else if(aa.length > 1){
            let ret = '';
            for(let i = 0;i < aa.length;i++){
                i > 0 && (ret += ',');
                ret += `<${aa[i].sym}>`;
            }
            singlePosErr(`cannot identify ${a.val} as a token, since it could be ${ret}`, a);
            return null;
        }
        return aa[0];
    }
    function getTokenByName(t: JNode): TokenDef{
        let ret = _tokenNameTable[t.val];
        if(ret === undefined){
            singlePosErr(`cannot identify <${t.val}> as a token`, t);
            return null;
        }
        return ret;
    }
    function defineTokenPrec(tid: JNode, assoc: Assoc, type: TokenRefType){
        if(type === TokenRefType.TOKEN){
            let tk = getTokenByName(tid);
            if(tk !== null){
                tk.assoc = assoc;
                tk.pr = _pr;
            }
        }
        else if(type === TokenRefType.STRING){
            let tk = getTokenByAlias(tid);
            if(tk !== null){
                tk.assoc = assoc;
                tk.pr = _pr;
            }
        }
        else if(type === TokenRefType.NAME){
            let t2 = _pseudoTokens[tid.val] = _pseudoTokens[tid.val] || {
                assoc: assoc,
                pr: _pr,
                pos: tid
            };
        }
    }
    function setOpt(name: JNode, value: JNode){
        _f.opt[name.val] = { name: name, val: value };
    }
    function setOutput(n: JNode){
        _f.output = n;
    }
    function setHeader(h: JNode){
        _f.header.push(h);
    }
    function setExtraArg(a: JNode){
        _f.extraArgs = a;
    }
    function setType(t: JNode){
        _f.sematicType = t;
    }
    function setInit(arg: JNode, body: JNode){
        _f.initArg = arg;
        _f.initBody = body;
    }
    function incPr(){
        _pr++;
    }
    function setEpilogue(ep: JNode){
        _f.epilogue = ep;
    }
    function prepareRule(lhs: JNode){
        if(_first){
            _first = false;
            prepareRule(newNode('(accept)'));
            addRuleItem(newNode(lhs.val), TokenRefType.NAME);
            addRuleItem(newNode('EOF'), TokenRefType.TOKEN);
            commitRule();
        }
        
        var nt = _ntTable[lhs.val];
        if(nt === undefined){
            nt = _ntTable[lhs.val] = {
                index: _g.nts.length,
                sym: lhs.val,
                firstSet: null,
                used: false,
                rules: [],
                parents: []
            }
            _g.nts.push(nt);
            _requiringNt.signal(lhs.val, nt);
        }
        let nr = new Rule(_g, nt, lhs);
        _ruleStack.push(nr);
    }
    function addRuleUseVar(vname: JNode){
        let t = _top();
        if(t.usedVars[vname.val] !== undefined){
            singlePosErr(`re-use of sematic variable "${vname.val}"`, vname);
        }
        else {
            t.usedVars[vname.val] = { pos: vname, val: 0 };
        }
    }
    function addRuleSematicVar(vname: JNode){
        let t = _top();
        if(t.usedVars[vname.val] !== undefined){
            //err(`variable "${vname}" conflicts with imported variable defined at line ${t.usedVars[vname].line}`, line);
            singlePosErr(`variable "${vname.val}" conflicts with another imported variable`, vname);
        }
        else if(t.vars[vname.val] !== undefined){
            singlePosErr(`sematic variable "${vname.val}" is already defined`, vname);
        }
        else {
            _sematicVar = vname;
        }
    }
    function addRuleItem(id: JNode, type: TokenRefType){
        let t = _top();
        if(t.action !== null){
            _splitAction();
        }
        if(_sematicVar !== null){
            t.vars[_sematicVar.val] = { val: t.rhs.length, pos: _sematicVar };
            _sematicVar = null;
        }
        if(type === TokenRefType.NAME){
            let pos = t.rhs.length;
            t.rhs.push(0);
            _requiringNt.wait(id.val, (su, nt) => {
                if(su){
                    t.rhs[pos] = -nt.index - 1;
                    nt.parents.push({
                        rule: t,
                        pos: pos
                    });
                    nt.used = true;
                }
                else {
                    singlePosErr(`use of undefined non terminal ${id.val}`, id);                    
                }
            });
        }
        else if(type === TokenRefType.TOKEN){
            let tl = _tokenNameTable[id.val];
            if(tl === undefined){
                singlePosErr(`cannot recognize <${id.val}> as a token`, id);
                return;
            }
            t.rhs.push(tl.index);
            tl.used = true;
        }
        else if(type === TokenRefType.STRING){
            let td = getTokenByAlias(id);
            if(td !== null){
                t.rhs.push(td.index);
                td.used = true;
            }
        }
    }
    function addAction(b: LexAction[]){
        var t = _top();
        if(t.action !== null){
            _splitAction();
        }
        t.action = b;
        if(_sematicVar !== null){
            t.vars[_sematicVar.val] = { val: t.rhs.length, pos: _sematicVar };
            _sematicVar = null;
            _splitAction();
        }
    }
    function defineRulePr(token: JNode, type: TokenRefType){
        if(type === TokenRefType.STRING || type === TokenRefType.TOKEN){
            let tk: TokenDef = type === TokenRefType.STRING ? 
                getTokenByAlias(token) : 
                getTokenByName(token);
            if(tk !== null){
                if(tk.assoc === Assoc.UNDEFINED){
                    singlePosErr(`precedence of token "${token.val}" has not been defined`, token);
                    return;
                }
                _top().pr = tk.pr;
            }
        }
        else {
            var pt = _pseudoTokens[token.val];
            if(!pt){
                singlePosErr(`pseudo token "${token}" is not defined`, token);
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
    function addPushStateAction(acts: LexAction[], vn: JNode){
        lexBuilder.requiringState.wait(vn.val, (su, sn) => {
            if(su){
                acts.push(pushState(sn));
            }
            else {
                singlePosErr(`state "${vn.val}" is undefined`, vn);
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
                        singlePosErr(`cannot find variable "${vname}": ${msg}`, v.pos);
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
