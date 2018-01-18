import { InputStream,biss, OutputStream } from '../util/io.js';
import { State, EndAction, Arc } from './state';

export class DFA<T>{
    start: State<T>;
    constructor(public states: State<T>[]){
        this.start = states[0];
    }
    forEachArc(cb: (arc: Arc<T>, from: State<T>, to: State<T>) => any){
        for(let from of this.states){
            for(let arc of from.arcs){
                cb(arc, from, arc.to);
            }
        }
    }
    print(os: OutputStream){
        for(let s of this.states){
            s.print(os, false);
            os.writeln();
        }
    }
    toString(): string{
        var ret = '';
        for(var i = 0;i < this.states.length;i++){
            ret += this.states[i].toString() + '\n';
        }
        return ret;
    }
    
    matcher(stream: InputStream){
        var bs = biss(stream);
        var backups = [];
        var matched = [];
        var marker = null;
        var c = bs.peek();
        var cs;
        function nc(){
            if(marker !== null){
                backups.push(c);
            }
            matched.push(c);
            bs.next();
            c = bs.peek();
        }
        function rollback(){
            cs = marker;
            marker = null;
            while(backups.length > 0){
                bs.backup(backups.pop());
                matched.pop();
            }
        }
        var cela = this;
        return function(){
            c = bs.peek();
            cs = cela.start;
            matched.length = 0;
            backups.length = 0;
            marker = null;
            var ns;
            while(true){
                if(cs.endAction !== null){
                    // this state is an end state,be carefull
                    if(cs.hasArc()){
                        ns = c !== null ? cs.getState(c.charCodeAt(0)) : null;
                        if(ns === null){
                            return { matched: matched.join(''),action: cs.endAction };
                        }
                        else {
                            backups.length = 0;
                            marker = cs;
                            cs = ns;
                            nc();
                        }
                    }
                    else {
                        return { matched: matched.join(''),action: cs.endAction };
                    }
                }
                else {
                    ns = c !== null ? cs.getState(c.charCodeAt(0)) : null;
                    if(ns === null){
                        if(marker !== null){
                            rollback();
                            return { matched: matched.join(''),action: cs.endAction };
                        }
                        else if(c === null){
                            //eof
                            return null;
                        }
                        else {
                            throw new Error('unexpected character "' + c + '"');
                        }
                    }
                    else {
                        cs = ns;
                        nc();
                    }
                }
            }
            // return null;
        }
    }
}
