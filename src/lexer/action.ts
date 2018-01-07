import { TokenDef } from "../grammar/token-entry";
import { CodeGenerator } from '../codegen/code-generator';

export interface LexAction{
    toCode(c: CodeGenerator);
    token: number;
};
// export type LexAction = (c: CodeGenerator) => any; 
function noToken(){
    return -1;
}
function noCode(c: CodeGenerator){

}

export function returnToken(tk: TokenDef): LexAction{
    return {
        toCode: noCode,
        token: tk.index
    };
}

export function pushState(n: number): LexAction{
    return {
        toCode(c){
            c.pushLexState(n);
        },
        token: -1
    };
}

export function popState(): LexAction{
    return {
        toCode(c){
            c.popLexState();
        },
        token: -1
    };
}

export function blockAction(b: string, line: number): LexAction{
    return {
        toCode(c){
            c.addBlock(b, line);
        },
        token: -1
    };
}

export function setImg(img: string): LexAction{
    return {
        toCode(c){
            c.setImg(img);
        },
        token: -1
    };
}