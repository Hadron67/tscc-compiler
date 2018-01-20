import { IntervalSet } from "./interval-set";

interface ClassDesc<T>{
    id: number;
    data: T[];
};

interface ClassFinder<T>{
    addClass(set: IntervalSet<any>, data: T);
    done(): { classCount: number, classSet: IntervalSet<ClassDesc<T>> };
};

export function createClassFinder<T>(): ClassFinder<T>{
    let classCount = 0;
    let lastClassCount = 0;
    let classMap: number[] = [];
    let classSet = new IntervalSet<ClassDesc<T>>({
        createData: () => ({ id: -1, data: [] }),
        stringify: n => `(${n.id})`,
        union(dest, src){
            if(dest.id === -1){
                dest.id = src.id;
            }
            else if(dest.id < lastClassCount){
                dest.id = classMap[dest.id] !== undefined ? classMap[dest.id] : (classMap[dest.id] = classCount++);
            }
            for(let d of src.data){
                dest.data.push(d);
            }
        }
    });
    return {
        addClass,
        done
    };
    function addClass(set: IntervalSet<any>, data: T){
        let cid = classCount;
        lastClassCount = classCount++;
        classMap.length = 0;
        set.forEach((a, b, it) => {
            classSet.add(a, b, { id: cid, data: [data] });
        });
    }
    function done(){
        classMap.length = 0;
        classCount = 0;
        classSet.forEach((a, b, it) => {
            it.data.id = classMap[it.data.id] !== undefined ? classMap[it.data.id] : (classMap[it.data.id] = classCount++);
        });
        return { classCount, classSet };
    }
}