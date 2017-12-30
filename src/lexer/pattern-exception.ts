import { JsccError } from '../util/E';
export class PatternException extends JsccError{
    constructor(msg: string){
        super(msg, 'PatternException');
    }
}
