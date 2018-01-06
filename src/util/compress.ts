
export interface Table{
    readonly rows: number;
    readonly columns: number;
    isEmpty(i: number,j: number): boolean;
    emptyCount(row: number): number;
}
function sorter(cmp: (a: RowEntry, b: RowEntry) => number){
    var a: RowEntry[] = [];
    function insert(i,obj){
        a.push(null);
        for(var j = a.length - 1;j > i;j--){
            a[j] = a[j - 1];
        }
        a[i] = obj;
    }
    return {
        add: function(b: RowEntry): void{
            var i: number;
            for(i = 0;i < a.length;i++){
                if((i === 0 || cmp(b,a[i - 1]) >= 0) && cmp(b,a[i]) <= 0){
                    break;
                }
            }
            insert(i,b);
        },
        done: function(): RowEntry[]{
            return a;
        }
    };
}
class RowEntry{
    public dp: number | null = 0;
    constructor(public emptyCount: number, public row: number){}
}

/**
 * implementation of double displacement first-fit-decreasing method
 * @param {{rows: number,columns: number,isEmpty: function,emptyCount: function}} source - data to be compressed
 * @returns {{dps: number[],len: number}} - displacements for each row.
 */
export function compress(source: Table): { dps: number[], len: number }{
    function empty(i: number, j: number): boolean{
        j = j - sorted[i].dp;
        return j < 0 || j >= source.columns || source.isEmpty(sorted[i].row,j);
    }
    function fit(i: number, dp: number): boolean{
        for(var j = 0;j < source.columns;j++){
            if(!empty(i,j)){
                for(var k = 0;k < i;k++){
                    if(!empty(k,j + dp)){
                        return false;
                    }
                }
            }
        }
        return true;
    }
    function getFitdp(i: number): number{
        var dp = 0;
        while(-dp < source.columns && source.isEmpty(sorted[i].row,-dp)){ dp--; }
        while(!fit(i,dp)){ dp++; }
        return dp;
    }
    var tmpsorted = sorter((a, b) => {
        return a.emptyCount < b.emptyCount ? -1 :
            a.emptyCount > b.emptyCount ? 1 : 0;
    });
    for(var i = 0;i < source.rows;i++){
        tmpsorted.add(new RowEntry(source.emptyCount(i),i));
    }

    var sorted = tmpsorted.done();
    //the row with least empty entries has displacement 0
    var maxdp = 0, mindp = 0;
    var dps = new Array(source.rows);
    dps[sorted[0].row] = sorted[0].dp = 0;
    
    for(var i = 1;i < sorted.length;i++){
        var row = sorted[i].row;
        var dp = getFitdp(i);
        dps[row] = sorted[i].dp = dp;
        dp > maxdp && (maxdp = dp);
        dp < mindp && (mindp = dp);
    }

    // for(var i = 0;i < dps.length;i++){
    //     dps[i] -= mindp;
    // }

    return {
        dps: dps,
        len: maxdp + source.columns// - mindp
    };
}
