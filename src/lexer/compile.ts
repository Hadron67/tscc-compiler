import { PatternException as E } from './pattern-exception.js';
import { Action,Arc,EndAction,State } from './state.js';
import { CharSet } from './char-set';

export interface StringContainer{
    val: string;
};

function stackReader(str: string, strs?: {[s: string]: StringContainer}){
    var stack = [{ sptr: 0,s: str,name: '' }];
    var top = stack[0];
    function checkNested(name: string){
        for(var i = 0;i < stack.length;i++){
            if(stack[i].name === name){
                throw new E('cannot use pattern "' + name + '" which leads to loop reference');
            }
        }
    }
    return {
        next: function(){
            top.sptr++;
            if(top.sptr >= top.s.length){
                stack.length > 1 && stack.pop();
                top = stack[stack.length - 1];
            }
        },
        peek: function(){
            return top.s[top.sptr] || null;
        },
        pushTo: function(name){
            var nn = strs ? strs[name].val : null;
            if(!nn){
                throw new E('undefined name "' + name + '"');
            }
            checkNested(name);
            stack.push({ sptr: 0,s: '(' + nn + ')',name: name });
            top = stack[stack.length - 1];
        }
    };
}

/**
 * compile a regular expression into e-NFA
 * @param {string} input
 * @param {number} stateCount
 * @param {Object.<string,string>|undefined} regs
 * @returns {{result: State,stateCount: number,tail: State}}
 */
export function compile<T>(input: string, stateCount: number = 0, regs: {[s: string]: StringContainer} = {}){
    stateCount = stateCount || 0;
    var stateCountDelta = 0;
    var reader = stackReader(input,regs);
    var c = reader.peek();

    function nc(){
        reader.next();
        c = reader.peek();
    }
    function notEof(reason?: string){
        if(c === null){
            throw new E('unexpected end of string' + (reason ? ', ' + reason : ''));
        }
    }
    function ns(){
        var s = new State<T>();
        s.index = stateCount++;
        stateCountDelta++;
        return s;
    }
    function eof(){
        return c === null;
    }
    function expect(c1){
        if(c !== c1){
            throw new E('unexpected character "' + c + '",expecting "' + c1 + '"');
        }
        nc();
    }

    /**
     * rexp() -> simpleRE() ('|' simpleRE())*
     */
    function rexp(start: State<T>): State<T>{
        var ret = simpleRE(start);
        while(!eof() && c === '|'){
            nc();
            var es = ns();
            start.epsilonTo(es);
            simpleRE(es).epsilonTo(ret);                
        }
        return ret;
    }

    /**
     * simpleRE() -> ( basicRE() )+
     */
    function simpleRE(start: State<T>): State<T>{
        var ret = start;
        do{
            ret = basicRE(ret);
        }while(!eof() && c !== '|' && c !== ')');
        return ret;
    }

    /**
     * basicRE() -> primitive() ['+'|'*'|'?']
     */
    function basicRE(start: State<T>): State<T>{
        var holder = ns();
        start.epsilonTo(holder);
        var ret = primitive(holder);
        
        if(c === '*'){
            nc();
            ret.epsilonTo(holder);
            var nn = ns();
            holder.epsilonTo(nn);
            return nn;
        }
        else if(c === '+'){
            nc();
            var count = ns();
            ret.epsilonTo(count);
            count.epsilonTo(holder);
            return count;
        }
        else if(c === '?'){
            nc();
            var nn2 = ns();
            holder.epsilonTo(nn2);
            ret.epsilonTo(nn2);
            return nn2;
        }
        else {
            return ret;
        }
    }
    /**
     * primitive() -> 
     *   '(' rexpr() ')'
     * | '.'
     * | '[' set() ']'
     * | '{' NAME '}'
     * | *
     */
    function primitive(start: State<T>): State<T>{
        notEof();
        if(c === '('){
            nc();
            let ret = rexp(start);
            expect(')');
            return ret;
        }
        else if(c === '.'){
            nc();
            let ret = ns();
            start.to(ret).chars.addAll();
            return ret;
        }
        else if(c === '['){
            nc();
            var neg = c as string === '^';
            neg && nc();
            let ret = ns();
            var set = start.to(ret).chars;
            neg && set.addAll();
            while(c as string !== ']' && !eof()){
                setItem(set,neg);
            }
            expect(']');
            return ret;
        }
        else if(c === '{'){
            nc();
            var name = '';
            while(c as string !== '}'){
                notEof();
                name += c;
                nc();
            }
            nc();
            reader.pushTo(name);
            c = reader.peek();
            return simpleRE(start);
        }
        else {
            let ret = ns();
            start.to(ret).chars.add(gchar());
            return ret;
        }
    }
    function gchar(): number{
        notEof();
        if(c === '\\'){
            nc();
            let ret: number | string = c.charCodeAt(0);
            switch(c as string){
                case 't': ret = '\t';
                case 'n': ret = '\n';
                case 'r': ret = '\r';
                case 'x': 
                    nc();
                    var code = '';
                    while(c !== null && /[0-9a-fA-F]/.test(c)){
                        code += c;
                        nc();
                    }
                    return parseInt(code,16);
                default: ret = c;
            }
            nc();
            return ret.charCodeAt(0);
        }
        else {
            var ret = c.charCodeAt(0);
            nc();
            return ret;
        }
    }
    /**
     * setItem() ->
     *   gchar() ['-'gchar()]
     */
    function setItem(set: CharSet<any>, neg: boolean){
        var s = gchar();
        var from = s,to = s;
        if(c === '-'){
            nc();
            to = gchar();
            if(to < from){
                throw new E('left hand side must be larger than right hand side in wild card character (got "' 
                + from.toString(16) + '" < "'
                + to.toString(16) + '")');
            }
        }
        if(neg){
            set.remove(from,to);
        }
        else {
            set.add(from,to);
        }
    }

    var head = ns();
    head.isStart = true;
    var tail = rexp(head);
    return {
        result: head,
        tail: tail,
        stateCount: stateCountDelta
    };
}
/**
 * compile a string into e-NFA,i.e.,regarde it as a regular 
 * expression with all metacharacters escaped.
 * 
 * @returns {{result: State,stateCount: number,tail: State}}
 */
export function compileRaw<T>(input: string, stateCount: number = 0){
    var sptr = 0;
    var stateCountDelta = 0;
    var c = input.charAt(sptr);
    function ns(){
        var s = new State<T>();
        s.index = stateCount++;
        stateCountDelta++;
        return s;
    }
    function nc(){
        c = input.charAt(++sptr) || null;
    }
    function eof(){
        return c === null;
    }

    var head = ns();
    head.isStart = true;
    var tail = head;
    while(!eof()){
        var s = ns();
        tail.to(s).chars.add(c.charCodeAt(0));
        tail = s;
        nc();
    }
    return {
        result: head,
        tail: tail,
        stateCount: stateCountDelta
    };
}