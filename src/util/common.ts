
export var YYTAB: string = '    ';
export var DEBUG: boolean = true;

export interface Console{
    assert: (expr: boolean) => any;
    log: (s: string) => void;
}

export var console: Console = {
    assert(expr){
        if(!expr){
            throw new Error('Assertion failed');
        }
    },
    log(s){},
};

export function setDebugger(d: Console){
    return console.log = d.log;
}
export function setTab(t: string): string{
    return YYTAB = t;
}



