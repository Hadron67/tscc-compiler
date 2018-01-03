import { Grammar } from '../grammar/grammar.js';
import { LexAction } from '../lexer/action';
import { DFA } from '../lexer/dfa';

export class File{
    grammar: Grammar = null;
    lexDFA: DFA<LexAction[]>[] = [];
    opt: {[s: string]: string} = {};
}
