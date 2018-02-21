import { JsccError, JsccWarning } from './E';

export interface Context{
    warn(w: JsccWarning);
    err(e: JsccError);
    requireLines(cb: (ctx: Context, lines: string[]) => any);
    beginTime(name: string);
    endTime();
}