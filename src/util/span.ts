export interface EscapeDef {
    from: string;
    to: string;
};
export class Span {
    private _s: { content: string, escape: boolean }[] = [];
    append(content: string, escape: boolean = true): Span {
        if(this._s.length > 0 && this._s[this._s.length - 1].escape === escape){
            this._s[this._s.length - 1].content += content;
        }
        else {
            this._s.push({ content, escape });
        }
        return this;
    }
    toString(escapes?: EscapeDef[]): string {
        var ret = '';
        for(var it of this._s){
            var s = it.content;
            if(escapes && it.escape){
                for(var escape of escapes){
                    s = s.replace(escape.from, escape.to);
                }
            }
            ret += s;
        }
        return ret;
    }
};