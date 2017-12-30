
const BSIZE = 32;
export class BitSet{
    private _s: number[];
    constructor(private _size: number){
        this._s = new Array(Math.ceil(_size / BSIZE));
        for(var i = 0; i < this._s.length; i++){
            this._s[i] = 0;
        }
    }
    public add(i: number): boolean{
        var block = Math.floor(i / BSIZE);
        var offset = i - block * BSIZE;
        var orig = this._s[block];
        this._s[block] |= (1 << offset);
        return orig !== this._s[block];
    }
    public addAll(): void{
        for(var i = 0;i < this._s.length;i++){
            this._s[i] = ~0;
        }
    }
    public remove(i: number): boolean{
        var block = Math.floor(i / BSIZE);
        var offset = i - block * BSIZE;
        var orig = this._s[block];
        this._s[block] &= ~(1 << offset);
        return orig !== this._s[block];
    }
    public removeAll(): void{
        for(var i = 0;i < this._s.length;i++){
            this._s[i] = 0;
        }
    }
    public contains(i: number): boolean{
        var block = Math.floor(i / BSIZE);
        var offset = i - block * BSIZE;
        return (this._s[block] & (1 << offset)) !== 0;
    }
    public union(set: BitSet): boolean{
        var changed = false;
        for(var i = 0;i < this._s.length;i++){
            var orig = this._s[i];
            this._s[i] |= set._s[i];
            changed = changed || (this._s[i] !== orig);
        }
        return changed;
    }
    public hasIntersection(set: BitSet): boolean{
        for(var i = 0;i < this._s.length;i++){
            if((this._s[i] & set._s[i]) !== 0){
                return true;
            }
        }
        return false;
    }
    public equals(set: BitSet): boolean{
        for(var i = 0;i < this._s.length;i++){
            if(this._s[i] !== set._s[i]){
                return false;
            }
        }
        return true;
    }
    public forEach(cb: (i: number) => any){
        for(var i = 0;i < this._size;i++){
            this.contains(i) && cb(i);
        }
    }
    public hash(): string{
        var ret = '';
        for(var i = 0;i < this._s.length;i++){
            ret += this._s[i].toString(16) + '-';
        }
        return ret;
    }
}

