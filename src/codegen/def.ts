import { OutputStream } from '../util/io';
import { DFA } from '../lexer/dfa';
import { LexAction } from '../lexer/action';
import { IParseTable } from '../grammar/ptable';
import { Grammar } from '../grammar/grammar';
import { CompressedPTable } from '../grammar/ptable-compress';

export interface TemplateInput{
    prefix: string;
    endl: string;
    opt: {[s: string]: string};
    header: string;
    extraArg: string;
    // grammar
    g: Grammar;
    pt: CompressedPTable;
    sematicType: string;

    // lex
    dfas: DFA<LexAction[]>[];
};
export interface TemplateOutput{
    write(s: string | number);
    writeln(s: string | number);
};