import { Span } from './span';
export interface ErrPrintOption{
    typeClass?: string;
}
export class InternalError{
    constructor(public msg: string){}
    toString(){
        return this.msg;
    }
}
export class JsccError{
    constructor(public msg: string, public type: string = 'Error'){}
    public toString(opt: ErrPrintOption = {}): Span {
        var ret = new Span();
        if(opt.typeClass){
            ret.append(`<span class="${opt.typeClass}">${ret}</span>`, false);
        }
        else {
            ret.append(this.type);
        }
        ret.append(': ');
        ret.append(this.msg);
        return ret;
    }    
}
export class CompilationError extends JsccError{
    constructor(msg: string, public line: number){
        super(msg, 'CompilationError');
    }
    public toString(opt: ErrPrintOption): Span{
        return super.toString().append(`(at line ${this.line})`);
    }
}
export class JsccWarning extends JsccError{
    constructor(msg: string){
        super(msg, 'Warning');
    }
}