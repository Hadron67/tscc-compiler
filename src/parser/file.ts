import { Grammar } from '../grammar/grammar.js';
import { LexAction } from '../lexer/action';
import { DFA } from '../lexer/dfa';
import { JNode } from './node';

export class File{
    grammar: Grammar = null;
    lexDFA: DFA<LexAction[]>[] = [];
    opt: {[s: string]: string} = {};
    prefix: string = 'jj';
    header: string = '';
    extraArgs: string = '';
    initArg: string = '';
    initBody: string = '';
    epilogue: JNode = null;
    sematicType: string;
}
