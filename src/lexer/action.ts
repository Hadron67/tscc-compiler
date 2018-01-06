import { TokenDef } from "../grammar/token-entry";
import { CodeGenerator } from '../templates/code-generator';

// export interface LexAction{
//     toCode(): string;
// };
export type LexAction = (c: CodeGenerator) => any; 

// export function returnToken(tk: TokenDef): LexAction{
//     return {
//         toCode: function(){
//             // TODO: token to code
//             return '';
//         }
//     };
// }

// export function pushState(n: number): LexAction{
//     return {
//         toCode: function(){
//             // TODO: push state
//             return '';
//         }
//     };
// }

// export function popState(): LexAction{
//     return {
//         toCode: function(){
//             return '';
//         }
//     };
// }

// export function blockAction(b: string): LexAction{
//     return {
//         toCode: function(){
//             return '';
//         }
//     };
// }

// export function setImg(img: string): LexAction{
//     return {
//         toCode: function(){
//             return '';
//         }
//     };
// }