export function initArray<T>(len: number, cb: (i: number) => T){
    let ret: T[] = new Array(len);
    for(let i = 0; i < len; i++){
        ret[i] = cb(i);
    }
    return ret;
}