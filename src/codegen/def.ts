import { OutputStream } from '../util/io';
import { DFA } from '../lexer/dfa';
import { LexAction } from '../lexer/action';
import { IParseTable } from '../grammar/ptable';
import { Grammar } from '../grammar/grammar';
import { CompressedPTable } from '../grammar/ptable-compress';
import { File } from '../parser/file';

export interface TemplateInput{
    endl: string;
    file: File;
    // grammar
    pt: CompressedPTable;
};
export interface TemplateOutput{
    write(s: string | number);
    writeln(s: string | number);
};