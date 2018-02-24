import { TokenDef } from "../grammar/token-entry";
import { Position } from "../parser/node";

export interface CodeGenerator{
    raw(s: string);
    beginBlock(pos: Position, always: boolean);
    endBlock(pos: Position);

    pushLexState(n: number);
    switchToLexState(n: number);
    popLexState();
    setImg(n: string);
    
    tokenObj(); // $token
    matched(); // $matched
    lhs(); // $$
    emitToken(tid: number);
};