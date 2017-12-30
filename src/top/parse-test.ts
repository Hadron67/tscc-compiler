import { JsccError as E } from '../util/E';
import { Action } from '../grammar/item-set';
import { Grammar } from '../grammar/grammar';
import { ParseTable } from '../grammar/ptable';

function testParse(g: Grammar, pt: ParseTable, tokens: string[]): string[]{
    var tk = [];
    for(var i = 0; i < tokens.length;i++){
        var tid = g.findToken(tokens[i]);
        if(tid === -1){
            throw new E('cannot recognize "' + tokens[i] + '" as a token');
        }
        tk.push(tid);
    }
    var state = [ 0 ];
    var stack = [];
    var ret = [];
    function s(){
        return state[state.length - 1];
    }
    function shift(ns){
        state.push(ns);
        stack.push(g.tokens[tk.shift()].sym);
    }
    function reduce(rule){
        
    }
    function dump(){
        var ret = '';
        for(var i = 0;i < stack.length;i++){
            ret += stack[i] + ' ';
        }
        ret += '| ';
        for(var i = 0;i < tk.length;i++){
            ret += g.tokens[tk[i]].sym + ' ';
        }
        return ret;
    }
    ret.push(dump());
    do{
        var item = pt.lookupShift(s(),tk[0] || 0);
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