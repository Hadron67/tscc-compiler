import { TokenDef } from "../grammar/token-entry";
import { CodeGenerator } from '../codegen/code-generator';
import { Position } from "../parser/node";

// export interface LexAction{
//     toCode(c: CodeGenerator);
//     token: number;
// };
type Codecb = (c: CodeGenerator) => any;
export function pushStateAction(sn: number): Codecb{
    return c => {
        c.pushLexState(sn);
    }
}
export function switchToStateAction(sn: number): Codecb{
    return c => {
        c.switchToLexState(sn);
    }
}
export class LexAction{
    token: TokenDef = null;
    actions: Codecb[] = [];

    toCode(c: CodeGenerator){
        for(let act of this.actions){
            act !== null && act(c);
        }
    }

    returnToken(tk: TokenDef){
        this.token = tk;
    }
    raw(s: string){
        this.actions.push(c => c.raw(s));
    }
    pushState(n: number){
        this.actions.push(pushStateAction(n));
    }
    placeHolder(){
        let ret = this.actions.length;
        this.actions.push(null);
        return ret;
    }
    set(n: number, cb: Codecb){
        this.actions[n] = cb;
    }
    popState(){
        this.actions.push(c => c.popLexState());
    }
    beginBlock(pos: Position, always: boolean){
        this.actions.push(c => c.beginBlock(pos, always));
    }
    setImg(s: string){
        this.actions.push(c => c.setImg(s));
    }
    endBlock(pos: Position){
        this.actions.push(c => c.endBlock(pos));
    }
    lhs(){
        this.actions.push(c => c.lhs());
    }
    tokenObj(){
        this.actions.push(c => c.tokenObj());
    }
    matched(){
        this.actions.push(c => c.matched());
    }
}