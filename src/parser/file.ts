import { Grammar } from '../grammar/grammar.js';
import { LexAction } from '../lexer/action';
import { DFA } from '../lexer/dfa';
import { JNode, newNode } from './node';

export class File{
    grammar: Grammar = null;
    lexDFA: DFA<LexAction[]>[] = [];
    opt: {[s: string]: { name: JNode, val: JNode }} = {};
    prefix: string = 'jj';
    header: JNode[] = [];
    output: JNode = newNode('typescript');
    extraArgs: JNode = null;
    initArg: JNode = null;
    initBody: JNode = null;
    epilogue: JNode = newNode('');
    sematicType: JNode = null;
}
