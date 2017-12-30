import { DEBUG } from './common';



function copyArray(a: any[]): any[]{
    var ret = [];
    for(var i = 0;i < a.length;i++){
        ret.push(a[i]);
    }
    return ret;
}

function cm(a: Num, b: Num): number{
    if((a === Inf.oo && b !== Inf.oo) || (a !== Inf._oo && b === Inf._oo) || a > b){
        return 1;
    }
    else if((a === Inf._oo && b !== Inf._oo) || (a !== Inf.oo && b === Inf.oo) || a < b ){
        return -1;
    }
    else {
        return 0;
    }
}
export enum Inf{
    oo = "oo",
    _oo = "-oo"
};
export type Num = Inf | number;

export interface DataSet<T>{
    union(set: DataSet<T>): void;
    add(d: T): void;
    toArray(): T[];
}
class Interval<T>{
    public a: Num;
    public b: Num;
    public prev: Interval<T>;
    public next: Interval<T>;
    public parent: IntervalSet<T>;
    public dataSet: DataSet<T>;
    constructor(a: Num, b: Num){
        this.a = a;
        this.b = b;
    }
    
    public insertBefore(a: Num, b: Num, data?: T){
        if(this.parent.isValid(this) && !this.parent.noMerge && this.a === (b as number) + 1){
            this.a = a;
            return this;
        }
        else {
            var it = this.parent.createInterval(a,b,data);
            it.prev = this.prev;
            it.next = this;
            this.prev.next = it;
            this.prev = it;
            return it;
        }
    }
    public contains(a: Num): boolean{
        return cm(this.a,a) <= 0 && cm(this.b,a) >= 0;
    }
    public overlaps(a: Num, b: Num): boolean{
        return !(cm(a,this.b) > 0 || cm(b,this.a) < 0);
    }
    public insertAfter(a: Num, b: Num, data?: T): Interval<T>{
        if(this.parent.isValid(this) && !this.parent.noMerge && this.b === (a as number) - 1){
            this.b = b;
            return this;
        }
        else {
            var it = this.parent.createInterval(a,b,data);
            it.prev = this;
            it.next = this.next;
            this.next.prev = it;
            this.next = it;
            return it;
        }
    }
    public splitLeft(a: Num): Interval<T>{
        //DEBUG && console.assert(this.parent.noMerge);
        if(cm(a, this.a) > 0){
            var ret = this.insertBefore(this.a,(a as number) - 1);
            this.parent.noMerge && ret.dataSet.union(this.dataSet);
            this.a = a;
            return ret;
        }
        return this;
    }
    public splitRight(b: Num): Interval<T>{
        //DEBUG && console.assert(this.parent.noMerge);
        if(cm(b, this.b) < 0){
            var ret = this.insertAfter((b as number) + 1,this.b);
            this.parent.noMerge && ret.dataSet.union(this.dataSet);
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
        if(this.a !== Inf._oo && this.prev.a !== null && this.a === (this.prev.b as number) + 1){
            this.a = this.prev.a;
            this.prev.remove();
        }
        if(this.b !== Inf.oo && this.next.a !== null && this.b === (this.next.a as number) - 1){
            this.b = this.next.b;
            this.next.remove();
        }
        return this;
    }
    public toString(mapper: (a: Num) => string): string{
        var ret = '';
        function dfmapper(c: Num): string{
            return c === Inf.oo ? '+oo' : c === Inf._oo ? '-oo' : c.toString();
        }
        var a = (mapper || dfmapper)(this.a);
        var b = (mapper || dfmapper)(this.b);
        if(this.a === this.b){
            ret += a;
        }
        else{
            ret += this.a === Inf._oo ? '(' + a : '[' + a;
            ret += ',';
            ret += this.b === Inf.oo ? b + ')' : b + ']';
        }
        this.dataSet && (ret += this.dataSet.toString());
        return ret;
    }
}
function checkArg(a: Num, b: Num){
    if(cm(a,b) > 0){
        throw new Error(`illegal argument: "a"(${a}) must be no more than "b"(${b})`);
    }
}
export class IntervalSet<T>{
    public head: Interval<T>;
    public tail: Interval<T>;
    public noMerge: boolean;
    public dataSetConstructor: () => DataSet<T>;

    constructor(dataSetConstructor?: () => DataSet<T>){
        this.head = new Interval(0,0);
        this.head.parent = this;
        this.tail = new Interval(null,null);
        this.tail.parent = this;
        this.head.next = this.tail;
        this.tail.prev = this.head;
    
        this.noMerge = typeof dataSetConstructor !== 'undefined';
        this.dataSetConstructor = dataSetConstructor || null;
    }
    isValid(it: Interval<T>): boolean{
        return it !== this.head && it !== this.tail;
    }
    createInterval(a: Num, b: Num, data: T): Interval<T>{
        var ret = new Interval<T>(a,b);
        ret.parent = this;
        this.dataSetConstructor && (ret.dataSet = this.dataSetConstructor());
        data && ret.dataSet.add(data);
        return ret;
    }
    fitPoint(a: Num, b: Num): Interval<T>{
        for(var it = this.head;it !== this.tail;it = it.next){
            if((it === this.head || cm(a,it.b) > 0) && (it.next === this.tail || cm(b,it.next.a) < 0)){
                return it;
            }
        }
        return null;
    }
    overlaped(a: Num, b: Num): Interval<T>[]{
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
    add(a: Num, b: Num = a, data?: T){
        var noMerge = this.noMerge;
        // /b = b || a;
        DEBUG && checkArg(a,b);
        var overlap = this.overlaped(a,b);
        if(overlap === null){
            this.fitPoint(a,b).insertAfter(a,b,data);
        }
        else {
            if(!noMerge){
                var a1 = cm(a,overlap[0].a) < 0 ? a : overlap[0].a;
                var b1 = cm(b,overlap[1].b) > 0 ? b : overlap[1].b;
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
                    overlap[0].insertBefore(a,(overlap[0].a as number) - 1,data);
                }
                if(overlap[1].contains(b)) {
                    overlap[1].splitRight(b);
                }
                else {
                    overlap[1].insertAfter((overlap[1].b as number) + 1,b,data);
                }
                for(var it = overlap[0];it !== overlap[1];it = it.next){
                    it.dataSet.add(data);
                    if((it.b as number) + 1 < it.next.a){
                        it.insertAfter((it.b as number) + 1,(it.next.a as number) - 1,data);
                    }
                }
                overlap[1].dataSet.add(data);
            }
        }
        return this;
    }
    remove(a: Num, b: Num): IntervalSet<T>{
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
    forEach(cb: (a: Num, b: Num, it: Interval<T>) => any): IntervalSet<T>{
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
    contains(a: Num): boolean{
        for(var it = this.head.next;it !== this.tail;it = it.next){
            if(it.contains(a)){
                return true;
            }
        }
        return false;
    }
    toString(mapper: (a: Num) => string){
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