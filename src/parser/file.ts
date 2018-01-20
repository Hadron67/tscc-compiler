import { Grammar } from '../grammar/grammar.js';
import { LexAction } from '../lexer/action';
import { DFA } from '../lexer/dfa';
import { JNode, newNode } from './node';
import { DFATable } from '../lexer/dfa-table';

export class File{
    name: string;
    grammar: Grammar = null;
    lexDFA: DFA<LexAction[]>[] = [];
    dfaTables: DFATable<LexAction[]>[] = [];
    opt: {[s: string]: { name: JNode, val: JNode }} = {};
    
    prefix: string = 'jj';
    header: JNode[] = [];
    output: JNode = null;
    extraArgs: JNode = null;
    initArg: JNode = null;
    initBody: JNode = null;
    epilogue: JNode = null;
    sematicType: JNode = null;
}
