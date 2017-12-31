export interface Option{
    typeClass?: string;
    escape?: boolean;
}
export class JsccError{
    constructor(public msg: string, public type: string = 'Error'){}
    public toString(opt: Option = {}): string{
        var escape = !!opt.escape;
        var ret = this.type;
        if(opt.typeClass){
            ret = `<span class="${opt.typeClass}">${ret}</span>`;
        }
        ret += ': ';
        ret += escape ? this.msg.replace(/</g,'&lt').replace(/>/g,'&gt') : this.msg;
        return ret;
    }    
}
export class CompilationError extends JsccError{
    constructor(msg: string, public line: number){
        super(msg, 'CompilationError');
    }
    public toString(opt: Option){
        return `${super.toString(opt)} (at line ${this.line})`;
    }
}
export class JsccWarning extends JsccError{
    constructor(msg: string){
        super(msg, 'Warning');
    }
}