export interface EscapeDef {
    [from: string]: string;
};
export function escapeString(s: string, escapes: EscapeDef): string{
    var ret = '';
    for(var i = 0; i < s.length; i++){
        var c = s.charAt(i);
        ret += escapes[c] || c;
    }
    return ret;
}
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
    toString(escapes?: EscapeDef): string {
        var ret = '';
        for(var it of this._s){
            var s = it.content;
            if(escapes && it.escape){
                s = escapeString(s, escapes);
            }
            ret += s;
        }
        return ret;
    }
};