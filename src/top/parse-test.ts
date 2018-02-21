import { JsccError as E } from '../util/E';
import { Action, Item } from '../grammar/item-set';
import { Grammar, Rule } from '../grammar/grammar';
import { ParseTable, IParseTable } from '../grammar/ptable';
import { TokenDef, convertTokenToString } from '../grammar/token-entry';

function testParse(g: Grammar, pt: IParseTable, tokens: string[], onErr: (msg: string) => any): string[]{
    var tk: TokenDef[] = [];
    for(let tname of tokens){
        let tdef: TokenDef;
        if(/<[^>]+>/.test(tname)){
            tdef = g.findTokenByName(tname.substr(1, tname.length - 2));
            if(tdef === null){
                onErr(`cannot recognize ${tname} as a token`);
                return [];
            }
        }
        else {
            let defs = g.findTokensByAlias(tname);
            if(defs.length === 0){
                onErr(`cannot recognize "${tname}" as a token`);
                return [];
            }
            if(defs.length > 1){
                let msg = '';
                for(let def of defs){
                    msg += `<${def.sym}> `;
                }
                onErr(`cannot recognize "${tname}" as a token, since it can be ${msg}`);
                return [];
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
    function reduce(rule: Rule){
        state.length -= rule.rhs.length;
        stack.length -= rule.rhs.length;
        stack.push(rule.lhs.sym);
        var gotot = pt.lookupGoto(s(),rule.lhs.index).shift.stateIndex;
        state.push(gotot);
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
        let item = pt.lookupShift(s(),tk[0] ? tk[0].index : 0);
        if(item !== null){
            if(item === Item.NULL){
                ret.push('syntax error!');
                break;
            }
            else if(item.actionType === Action.SHIFT){
                if(tk.length === 0){
                    ret.push('accepted!');
                    break;
                }
                shift(item.shift.stateIndex);
            }
            else if(item.actionType === Action.REDUCE){
                if(reduce(item.rule)){
                    break;
                }
            }
            else {
                console.assert(false);
            }
        }
        else {
            let ri = pt.defred[s()];
            if(ri !== -1){
                reduce(g.rules[ri]);
            }
            else {
                ret.push('syntax error!');
                break;
            }
        }
        ret.push(dump());
    }while(true);
    return ret;
}

export { testParse }