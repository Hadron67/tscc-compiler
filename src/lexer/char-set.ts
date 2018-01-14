import { Inf, IntervalSet, DataSet } from '../util/interval-set';

var oo = Inf.oo;
var _oo = Inf._oo;
export class CharSet<T> extends IntervalSet<T>{
    constructor(datac?: () => DataSet<T>){
        super(datac);
    }
    addAll(): void{
        super.add(0, Inf.oo);
    }
    constainsAll(): boolean{
        let c = this.head.next;
        return c.next === this.tail && c.a === 0 && c.b === oo;
    }
    toString(): string{
        return super.toString(function(c){
            if(c !== oo && c !== _oo){
                if(c >= 0x20 && c <= 0x7e){
                    return '\'' + String.fromCharCode(c as number) + '\'';
                }
                else {
                    return '\\x' + (c as number).toString(16);
                }
            }
            else if(c === oo){
                return 'oo';
            }
            else {
                return '-oo';
            }
        });
    }
}
