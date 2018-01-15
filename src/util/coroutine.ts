// export interface Coroutine<T>{
//     run(a: T): void;
//     fail(): void;
// };

export type Coroutine<T> = (success: boolean, data: T) => any;

export class CoroutineMgr<T>{
    private _blocked: {[s: string]: Coroutine<T>[]} = {};

    constructor(public getRes: (s: string) => T){}

    wait(s: string, cr: Coroutine<T>){
        let r = this.getRes(s);
        if(r === undefined){
            this._blocked[s] || (this._blocked[s] = []);
            this._blocked[s].push(cr);
        }
        else {
            cr(true, r);
        }
    }
    signal(s: string, data: T){
        let crs = this._blocked[s];
        if(crs !== undefined){
            for(let cr of crs){
                cr(true, data);
            }
            delete this._blocked[s];
        }
    }
    fail(){
        for(let s in this._blocked){
            for(let cr of this._blocked[s]){
                cr(false ,null);
            }
        }
    }
}