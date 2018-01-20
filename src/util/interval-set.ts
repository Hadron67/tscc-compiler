// 区间集合

import { DEBUG } from './common';

export var oo = Number.POSITIVE_INFINITY;
export var _oo = Number.NEGATIVE_INFINITY;
class Interval<T>{
    public a: number;
    public b: number;
    public prev: Interval<T>;
    public next: Interval<T>;
    public parent: IntervalSet<T>;
    public data: T = null;
    constructor(a: number, b: number){
        this.a = a;
        this.b = b;
    }
    
    public insertBefore(a: number, b: number, data?: T){
        if(this.parent.isValid(this) && !this.parent.noMerge && this.a === b + 1){
            this.a = a;
            return this;
        }
        else {
            var it = this.parent.createInterval(a, b, data);
            it.prev = this.prev;
            it.next = this;
            this.prev.next = it;
            this.prev = it;
            return it;
        }
    }
    public contains(a: number): boolean{
        return this.a <= a && this.b >= a;
    }
    public overlaps(a: number, b: number): boolean{
        // return !(cm(a,this.b) > 0 || cm(b,this.a) < 0);
        return !(a > this.b || b < this.a);
    }
    public insertAfter(a: number, b: number, data?: T): Interval<T>{
        if(this.parent.isValid(this) && !this.parent.noMerge && this.b === a - 1){
            this.b = b;
            return this;
        }
        else {
            var it = this.parent.createInterval(a, b, data);
            it.prev = this;
            it.next = this.next;
            this.next.prev = it;
            this.next = it;
            return it;
        }
    }
    public splitLeft(a: number): Interval<T>{
        //DEBUG && console.assert(this.parent.noMerge);
        if(a > this.a){
            // don't pass the data, use union instead
            var ret = this.insertBefore(this.a, a - 1, this.data);
            this.a = a;
            return ret;
        }
        return this;
    }
    public splitRight(b: number): Interval<T>{
        //DEBUG && console.assert(this.parent.noMerge);
        if(b < this.b){
            var ret = this.insertAfter(b + 1, this.b, this.data);
            this.b = b;
            return ret;
        }
        return this;
    }
    public remove(): Interval<T>{
        this.prev.next = this.next;
        this.next.prev = this.prev;
        return this;
    }
    public checkMerge(): Interval<T>{
        if(this.a !== _oo && this.prev.a !== null && this.a === this.prev.b + 1){
            this.a = this.prev.a;
            this.prev.remove();
        }
        if(this.b !== oo && this.next.a !== null && this.b === this.next.a - 1){
            this.b = this.next.b;
            this.next.remove();
        }
        return this;
    }
    public toString(mapper: (a: number) => string): string{
        var ret = '';
        function dfmapper(c: number): string{
            return c === oo ? '+oo' : c === _oo ? '-oo' : c.toString();
        }
        var a = (mapper || dfmapper)(this.a);
        var b = (mapper || dfmapper)(this.b);
        if(this.a === this.b){
            ret += a;
        }
        else{
            ret += this.a === _oo ? '(' + a : '[' + a;
            ret += ',';
            ret += this.b === oo ? b + ')' : b + ']';
        }
        this.data && (ret += this.parent.dataOp.stringify(this.data));
        return ret;
    }
}
function checkArg(a: number, b: number){
    if(a > b){
        throw new Error(`illegal argument: "a"(${a}) must be no more than "b"(${b})`);
    }
}
export interface DataOperator<T> {
    createData(): T;
    union(dest: T, src: T): void;
    stringify(d: T): string;
}
export class IntervalSet<T>{
    public head: Interval<T>;
    public tail: Interval<T>;
    public noMerge: boolean;
    public dataOp: DataOperator<T>;

    constructor(dataOp?: DataOperator<T>){
        this.head = new Interval(0,0);
        this.head.parent = this;
        this.tail = new Interval(null,null);
        this.tail.parent = this;
        this.head.next = this.tail;
        this.tail.prev = this.head;
    
        this.noMerge = typeof dataOp !== 'undefined';
        this.dataOp = dataOp || null;
    }
    isValid(it: Interval<T>): boolean{
        return it !== this.head && it !== this.tail;
    }
    createInterval(a: number, b: number, data: T = null): Interval<T>{
        var ret = new Interval<T>(a,b);
        ret.parent = this;
        this.dataOp && (ret.data = this.dataOp.createData(), data !== null && this.dataOp.union(ret.data, data));
        return ret;
    }
    fitPoint(a: number, b: number): Interval<T>{
        for(var it = this.head;it !== this.tail;it = it.next){
            if((it === this.head || a > it.b) && (it.next === this.tail || b < it.next.a)){
                return it;
            }
        }
        return null;
    }
    overlaped(a: number, b: number): Interval<T>[]{
        var start = null,end = null;
        var it = this.head.next;
        for(;it !== this.tail && !it.overlaps(a,b);it = it.next);
        if(it === this.tail){
            return null;
        }
        start = end = it;
        for(;it !== this.tail && it.overlaps(a,b);it = it.next){
            end = it;
        }
        return [start,end];
    }
    /**
     * add an interval into the set
     * @param data - The extra data associated with the added interval, which is only valid when noMerge = true
     * 
     */
    add(a: number, b: number = a, data?: T){
        var noMerge = this.noMerge;
        // /b = b || a;
        DEBUG && checkArg(a,b);
        var overlap = this.overlaped(a,b);
        if(overlap === null){
            this.fitPoint(a,b).insertAfter(a,b,data);
        }
        else {
            if(!noMerge){
                var a1 = a < overlap[0].a ? a : overlap[0].a;
                var b1 = b > overlap[1].b ? b : overlap[1].b;
                overlap[0].a = a1;
                overlap[0].b = b1;
                overlap[0].next = overlap[1].next;
                overlap[1].next.prev = overlap[0];
                overlap[0].checkMerge();
            }
            else {
                if(overlap[0].contains(a)){
                    overlap[0].splitLeft(a);
                }
                else {
                    overlap[0].insertBefore(a, overlap[0].a - 1, data);
                }
                if(overlap[1].contains(b)) {
                    overlap[1].splitRight(b);
                }
                else {
                    overlap[1].insertAfter(overlap[1].b + 1, b, data);
                }
                for(var it = overlap[0];it !== overlap[1];it = it.next){
                    // it.dataSet.add(data);
                    this.dataOp.union(it.data, data);
                    if(it.b + 1 < it.next.a){
                        it.insertAfter(it.b + 1, it.next.a - 1, data);
                        it = it.next;
                    }
                }
                // overlap[1].dataSet.add(data);
                this.dataOp.union(overlap[1].data, data);
            }
        }
        return this;
    }
    remove(a: number, b: number): IntervalSet<T>{
        checkArg(a,b);
        var overlap = this.overlaped(a,b);
        if(overlap !== null){
            overlap[0].contains(a) && overlap[0].splitLeft(a);
            overlap[1].contains(b) && overlap[1].splitRight(b);
            overlap[0].prev.next = overlap[1].next;
            overlap[1].next.prev = overlap[0].prev;
        }
        return this;
    }
    removeAll(): IntervalSet<T>{
        this.head.next = this.tail;
        this.tail.prev = this.head;
        return this;
    }
    forEach(cb: (a: number, b: number, it: Interval<T>) => any): IntervalSet<T>{
        for(var it = this.head.next;it !== this.tail;it = it.next){
            cb(it.a,it.b,it);
        }
        return this;
    }
    union(s: IntervalSet<T>): IntervalSet<T>{
        for(var it = s.head.next;it !== s.tail;it = it.next){
            this.add(it.a,it.b);
        }
        return this;
    }
    contains(a: number): boolean{
        for(var it = this.head.next;it !== this.tail;it = it.next){
            if(it.contains(a)){
                return true;
            }
        }
        return false;
    }
    toString(mapper: (a: number) => string){
        var ret = '';
        var t = false;
        for(var it = this.head.next;it !== this.tail;it = it.next){
            if(t){
                ret += ',';
            }
            t = true;
            ret += it.toString(mapper);
        }
        return ret === '' ? 'phi' : ret;
    }
}