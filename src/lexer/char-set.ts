import { oo, _oo, IntervalSet, DataOperator } from '../util/interval-set';

export class CharSet<T> extends IntervalSet<T>{
    constructor(datac?: DataOperator<T>){
        super(datac);
    }
    addAll(): void{
        super.add(0, oo);
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
