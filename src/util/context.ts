import { JsccError, JsccWarning } from './E';

export interface Context{
    warn(w: JsccWarning);
    err(e: JsccError);
}