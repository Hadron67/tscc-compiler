import { Parser } from "./parser";
import { Context } from "../util/context";
import { CompilationError } from "../util/E";
import { GBuilder } from "./gbuilder";
import { File } from "./file";

export function parse(ctx: Context, source: string): File{
    let parser = new Parser();
    let err = false;
    parser.on('lexicalerror', (msg, line, column) => {
        ctx.err(new CompilationError(msg, line));
        parser.halt();
        err = true;
    });
    parser.on('syntaxerror', (msg, token) => {
        ctx.err(new CompilationError(msg, token.startLine));
        parser.halt();
        err = true;
    });
    parser.gb = new GBuilder(ctx);
    parser.accept(source);
    parser.end();
    if(err){
        return null;
    }
    else {
        return parser.gb.build();
    }
}