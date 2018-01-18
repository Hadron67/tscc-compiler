import { IntervalSet } from "./interval-set";



export function createClassFinder(){
    let classCount = 0;
    let it = new IntervalSet<number>(() => ({
        union: s => {},// not used
        toArray: () => [],// not used
        add(n){
            
        }
    }));
}