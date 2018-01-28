import { TokenDef } from "../grammar/token-entry";
import { CodeGenerator } from '../codegen/code-generator';
import { Position } from "../parser/node";

// export interface LexAction{
//     toCode(c: CodeGenerator);
//     token: number;
// };
type Codecb = (c: CodeGenerator) => any;
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
        this.actions.push(c => {
            c.raw(s);
        });
    }
    pushState(n: number){
        this.actions.push(c => {
            c.pushLexState(n);
        });
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
        this.actions.push(c => {
            c.popLexState();
        });
    }
    beginBlock(pos: Position){
        this.actions.push(c => {
            c.beginBlock(pos);
        });
    }
    setImg(s: string){
        this.actions.push(c => {
            c.setImg(s);
        });
    }
    endBlock(pos: Position){
        this.actions.push(c => {
            c.endBlock(pos);
        });
    }
    lhs(){
        this.actions.push(c => {
            c.lhs();
        });
    }
    tokenObj(){
        this.actions.push(c => {
            c.tokenObj();
        });
    }
}
// export type LexAction = (c: CodeGenerator) => any; 
// function noCode(c: CodeGenerator){

// }

// export function returnToken(tk: TokenDef): LexAction{
//     return {
//         toCode: noCode,
//         token: tk.index
//     };
// }

// export function pushState(n: number): LexAction{
//     return {
//         toCode(c){
//             c.pushLexState(n);
//         },
//         token: -1
//     };
// }

// export function popState(): LexAction{
//     return {
//         toCode(c){
//             c.popLexState();
//         },
//         token: -1
//     };
// }

// export function blockAction(b: string, line: number): LexAction{
//     return {
//         toCode(c){
//             c.addBlock(b, line);
//         },
//         token: -1
//     };
// }

// export function setImg(img: string): LexAction{
//     return {
//         toCode(c){
//             c.setImg(img);
//         },
//         token: -1
//     };
// }