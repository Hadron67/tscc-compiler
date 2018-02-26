
export abstract class OutputStream {
    endl: string = '\n';
    abstract write(s?: string | number): any;
    writeln(s?: string | number): any{
        s && this.write(s);
        this.write(this.endl);
    }
}
export class StringOS extends OutputStream {
    public s: string = '';
    write(s: string | number): any{
        this.s += s;
    }
    reset(): any{
        this.s = '';
    }
}

export interface InputStream{
    peek(): string;
    next(): string;
}
export interface BackupIs extends InputStream{
    backup(s: string): void;
}
export function StringIS(s: string): InputStream{
    var i = 0;
    return {
        peek: function(){
            return s.charAt(i) || null;
        },
        next: function(){
            var ret = this.peek();
            i++;
            return ret;
        }
    };
}
export function biss(iss: InputStream): BackupIs{
    var backup: string[] = [];
    return {
        peek: function(){
            return backup.length > 0 ? backup[backup.length - 1] : iss.peek();
        },
        next: function(){
            if(backup.length > 0){
                return backup.pop();
            }
            else {
                return iss.next();
            }
        },
        backup: function(c: string){
            backup.push(c);
        }
    };
}