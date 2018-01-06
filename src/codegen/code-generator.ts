import { TokenDef } from "../grammar/token-entry";

export interface CodeGenerator{
    addBlock(b: string, line: number);
    pushLexState(n: number);
    popLexState();
    setImg(n: string);
    returnToken(t: TokenDef);
};