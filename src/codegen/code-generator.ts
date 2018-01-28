import { TokenDef } from "../grammar/token-entry";
import { Position } from "../parser/node";

export interface CodeGenerator{
    raw(s: string);
    beginBlock(pos: Position);
    endBlock(pos: Position);

    pushLexState(n: number);
    popLexState();
    setImg(n: string);
    
    tokenObj(); // $token
    lhs(); // $$
    emitToken(tid: number);
};