export enum LexActionType{
    RETURN = 0,
    PUSH_STATE,
    POP_STATE,
    BLOCK
}

export class LexAction{
    constructor(public type: LexActionType, public arg: any){}
    
}