import { JsccError as E } from '../util/E';
import { Action } from '../grammar/item-set';
import { Grammar } from '../grammar/grammar';
import { ParseTable } from '../grammar/ptable';
import { TokenDef, convertTokenToString } from '../grammar/token-entry';

function testParse(g: Grammar, pt: ParseTable, tokens: string[]): string[]{
    var tk: TokenDef[] = [];
    for(let tname of tokens){
        let tdef: TokenDef;
        if(/<[^>]+>/.test(tname)){
            tdef = g.findTokenByName(tname.substr(1, tname.length - 2));
            if(tdef === null){
                throw new E(`cannot recognize ${tname} as a token`);
            }
        }
        else {
            let defs = g.findTokensByAlias(tname);
            if(defs.length === 0){
                throw new E(`cannot recognize "${tname}" as a token`);
            }
            if(defs.length > 1){
                let msg = '';
                for(let def of defs){
                    msg += `<${def.sym}> `;
                }
                throw new E(`cannot recognize "${tname}" as a token, since it can be ${msg}`);
            }
            tdef = defs[0];
        }
        tk.push(tdef);
    }
    var state = [ 0 ];
    var stack: string[] = [];
    var ret: string[] = [];
    function s(){
        return state[state.length - 1];
    }
    function shift(ns: number){
        state.push(ns);
        let tdef = tk.shift();
        // tdef.alias === null ? stack.push(`<${tdef.sym}>`) : stack.push(tdef.alias);
        stack.push(convertTokenToString(tdef));
        // stack.push(g.tokens[tk.shift()].sym);
    }
    function reduce(rule){
        
    }
    function dump(){
        var ret = '';
        for(let s of stack){
            ret += s + ' ';
        }
        ret += '| ';
        for(let tdef of tk){
            ret += convertTokenToString(tdef);
            ret += ' ';
        }
        return ret;
    }
    ret.push(dump());
    do{
        var item = pt.lookupShift(s(),tk[0] ? tk[0].index : 0);
        if(item !== null){
            if(item.actionType === Action.SHIFT){
                shift(item.shift.stateIndex);
            }
            else if(item.actionType === Action.REDUCE){
                var rule = item.rule;
                var rlen = rule.rhs.length;
                while(rlen --> 0){
                    state.pop();
                    stack.pop();
                }
                stack.push(g.nts[rule.lhs].sym);
                if(item.rule.index === 0){
                    ret.push('accepted!');
                    break;
                }
                else {
                    var gotot = pt.lookupGoto(s(),rule.lhs).shift.stateIndex;
                    state.push(gotot);
                }
            }
            else {
                console.assert(false);
            }
        }
        else {
            ret.push('syntax error!');
            break;
        }
        ret.push(dump());
    }while(true);
    return ret;
}

export { testParse }