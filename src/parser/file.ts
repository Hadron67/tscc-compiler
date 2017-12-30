import { Grammar } from '../grammar/grammar.js';
import { LexAction } from '../lexer/action';

export class File{
    grammar: Grammar = null;
    lexAct: { regexp: string, raw: boolean, actions: LexAction[]}[][] = []
    opt: {[s: string]: string} = {};
}
