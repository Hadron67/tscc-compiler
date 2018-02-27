import { DFA } from './dfa';
import { initArray } from '../util/initarray';
import { createClassFinder } from '../util/class-detect';
import { Arc, State } from './state';
import { compress, Table } from '../util/compress';
import { OutputStream } from '../util/io';
import { EscapeDef, escapeString } from '../util/span';

function arrayWrapper<T>(stateCount: number, classCount: number, rawTable: Arc<T>[]): Table{
    let emCount: number[] = [];
    for(let state = 0;state < stateCount;state++){
        emCount.push(0);
        for(let t = 0; t < classCount; t++){
            rawTable[state * classCount + t] === null && (emCount[state]++);
        }
    }
    return {
        rows: stateCount,
        columns: classCount,
        isEmpty(state, c){
            return rawTable[state * classCount + c] === null;
        },
        emptyCount(c){
            return emCount[c];
        }
    };
}

export class DFATable<T>{
    states: State<T>[];
    classCount: number;
    pnext: Arc<T>[];
    disnext: number[];
    checknext: number[];

    classTable: number[];
    unicodeClassTable: number[];

    private _trim(){
        while(this.pnext[this.pnext.length - 1] === null){
            this.pnext.pop();
            this.checknext.pop();
        }
    }
    constructor(dfa: DFA<T>, public maxAsicii: number = 255){
        function emitClassInterval(a: number, b: number, cl: number){
            for(; a <= b; a++){
                classTable[a] = cl;
            }
        }
        var cf = createClassFinder<Arc<T>>();
        dfa.forEachArc((arc, from, to) => {
            cf.addClass(arc.chars, arc);
        });
        var r = cf.done();
        this.classCount = r.classCount;
        this.states = dfa.states;
        var classTable: number[] = this.classTable = initArray<number>(maxAsicii + 1, i => -1);   
        var unicodeClassTable: number[] = this.unicodeClassTable = [];
        var rawTable = initArray<Arc<T>>(r.classCount * dfa.states.length, i => null);
        r.classSet.forEach((a, b, it) => {
            if(a > maxAsicii){
                unicodeClassTable.push(it.data.id, a, b);
            }
            else if(b <= maxAsicii){
                emitClassInterval(a, b, it.data.id);
            }
            else {
                emitClassInterval(a, maxAsicii, it.data.id);
                maxAsicii < b && unicodeClassTable.push(it.data.id, maxAsicii + 1, b);
            }
            for(let arc of it.data.data){
                rawTable[arc.from.index * r.classCount + it.data.id] = arc;
            }
        });
        
        var { len, dps } = compress(arrayWrapper(this.states.length, r.classCount, rawTable));
        this.disnext = dps;
        this.pnext = initArray<Arc<T>>(len, i => null);
        this.checknext = initArray<number>(len, i => -1);
        for(let s = 0; s < this.states.length; s++){
            for(let c = 0; c < this.classCount; c++){
                let arc = rawTable[s * this.classCount + c];
                if(arc !== null){
                    this.pnext[this.disnext[s] + c] = arc;
                    this.checknext[this.disnext[s] + c] = s;
                }
            }
        }
        this._trim();
    }
    lookup(s: number, c: number): Arc<T>{
        let ind = this.disnext[s] + c;
        if(ind >= 0 && ind < this.pnext.length && this.checknext[ind] === s){
            return this.pnext[ind];
        }
        else {
            return null;
        }
    }
    print(os: OutputStream, escapes?: EscapeDef){
        var tab = '    ';
        function char(c: number){
            if(c >= 0x20 && c <= 0x7e){
                return "'" + String.fromCharCode(c) + "'";
            }
            else {
                return `\\x${c.toString(16)}`;
            }
        }
        function echo(s: string){
            if(escapes){
                s = escapeString(s, escapes);
            }
            os.writeln(s);
        }
        let tl = 0;
        var line = 'class table:\n' + tab;
        for(let c = 0; c < this.classTable.length; c++){
            if(this.classTable[c] !== -1) {
                line += `${char(c)} -> c${this.classTable[c]}, `;
                tl++ > 9 && (line += `\n${tab}`, tl = 0);
            }
        }
        echo(line + '\n');

        line = 'unicode class table:\n' + tab;
        tl = 0;
        for(let c = 0, _a = this.unicodeClassTable; c < _a.length; c += 3){
            line += `\\x${_a[c + 1]}-\\x${_a[c + 2]} -> c${_a[c]}, `;
            tl++ > 4 && (line += `\n${tab}`, tl = 0);
        }
        echo(line + '\n');

        for(let s = 0; s < this.states.length; s++){
            line = `state ${s}:\n`;
            let state = this.states[s];
            state.endAction !== null && (line += `${tab}end = ${state.endAction.id}\n`);
            for(let c = 0; c < this.classCount; c++){
                let arc = this.lookup(s, c);
                arc !== null && (line += `${tab}c${c}: state ${arc.to.index}\n`);
            }
            echo(line);
        }
    }
}