import { State,EndAction } from './state';
import { DFA } from './dfa';
import { compile,compileRaw } from './compile';
import { console } from '../util/common';

/**
 * create an object that can construct a lexer dfa
 * @api public
 * @param {Object.<string,string>} regs 
 */
function lexerBuilder<T>(regs: { [s: string]: string } = {}){
    var actions = [];
    var pr = 0;
    function ns(){
        var ret = new State<T>();
        return ret;
    }
    var head = ns();
    return {
        lexRule: function(reg,id,data,raw){
            var action = new EndAction<T>();
            action.priority = pr++;
            action.id = id;
            action.data = data || null;
            var cpd = (!!raw ? compileRaw<T>(reg) : compile<T>(reg,regs));
            cpd.tail.endAction = action;
            head.epsilonTo(cpd.result);
            actions.push(action);
        },
        done: function(){
            head.removeEpsilons();
            var dhead = head.toDFA();
            var ret = new DFA<T>(dhead.states);
            return ret;
        }
    };
}

/**
 * 
 * @param {{regexp: string,id: number,data: any,raw: boolean}[]} defs 
 * @api public
 * @returns {DFA}
 */
function lexer<T>(defs,regs){
    var getdef;
    if(typeof defs !== 'function'){
        getdef = function(){
            return defs.shift() || null;
        }
    }
    else {
        getdef = defs;
    }

    var bd = lexerBuilder<T>(regs);
    var def = getdef();
    while(def !== null){
        bd.lexRule(def.regexp,def.id,def.data,def.raw);
        def = getdef();
    }
    return bd.done();
}

export { lexer,lexerBuilder };