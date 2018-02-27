export declare var version: string;
interface FileCreator {
    /**
     * Save current file
     * @param fname Name of current file
     */
    save(fname: string);
    /**
     * write a specified content to current file
     * @param s Content to be written
     */
    write(s: string);
    /**
     * write a specified content and a line terminator to current file
     * @param s Content to be written
     */
    writeln(s: string);
}
interface ErrPrintOption{
    typeClass?: string;
    escape?: boolean;
}
declare abstract class OutputStream {
    /** line terminator */
    endl: string;
    /**
     * write a specified content
     * @param s Content to be written
     */
    abstract write(s: string | number);
    /**
     * write a specified content and a line terminator
     * @param s Content to be written
     */
    writeln(s: string | number);
}
interface TSCCOptions{
    /** Name (path) of the input grammar file. */
    inputFile: string;
    /** Content of grammar file */
    input: string;
    /** Name (path) of the output file, if not specified, the output file won't be generated. */
    outputFile?: string;

    // interface
    /** An interface object to print all the messages */
    stdout: OutputStream;
    /** A callback used to write file.
     * @param path Path of the file to be written
     * @param content Content to be written
     */
    writeFile(path: string, content: string): any;

    // options
    /** 
     * test input. If specified, it will be parsed, and the process will be printed.
     * @default null
     */
    testInput?: string;
    /**
     * whether to print a detailed list of time costs.
     * @default false
     */
    printDetailedTime?: boolean;
    /**
     * whether to print lexical DFA tables to the output file.
     * @default false
     */
    printDFA?: boolean;
    /**
     * whether to show look-ahead tokens of items when printing parse table.
     * @default false
     */
    showlah?: boolean;
    /**
     * whether to show full item sets when printing parse table. Only kernel 
     * items will be printed when set to `false`
     * @default false
     */
    showFullItemsets?: boolean;
}
/**
 * Run a pre-defined main function with specified options. This function consists of
 * parsing grammar file, generating tables, writing output file and generating code. It 
 * provides a simple way to use tscc-compile via module.
 * @param opt Options.
 * @returns `0` if no error occur during compilation, otherwise returns `-1`.
 */
export declare function main(opt: TSCCOptions): number;

interface TSCCContext {
    /** 
     * Compile the specified grammar file, including parsing, generating lexical DFA, item sets,
     * and LALR(1) parse table.
     * @param source content of the grammar file;
     * @param fname name (path) of the grammar file.
     */
    compile(source: string, fname: string);
    /**
     * Add a set of escape characters. All the contents printed by any function
     * begin with `print` will be escaped.
     * @param escapes an object containing escape characters.
     */
    setEscape(escapes: {[s: string]: string});
    /**
     * Reset the whole context object. The object will look as if it was just created.
     */
    reset();
    /**
     * Start timing a process named `s`. The timing will start immediately after calling 
     * this function, and stops after calling `endTime()`. The elapsed time between these  
     * two calls will be printed when call `printDetailedTime(os)`.
     * 
     * Note that these two functions are also called inside of `compile()`, in order to measure
     * time costs of different compilation phases.
     * 
     * @param s name of the process being timed.
     */
    beginTime(s: string);
    /**
     * Stop timing the process.
     */
    endTime();

    /**
     * Print the generated item sets of the grammar.
     * @param stream stream to print.
     */
    printItemSets(stream: OutputStream);
    /**
     * Print the generated LALR(1) parse table.
     * @param os stream to print.
     * @param showlah whether to show look-ahead tokens of the item sets.
     * @param showFullItemSets whether to show full item sets. If set to `false`, only
     * kernel items will be shown.
     */
    printTable (os: OutputStream, showlah: boolean, showFullItemsets: boolean);
    /**
     * Print the grnerated lexical DFA tables.
     * @param os stream to print.
     */
    printDFA(os: OutputStream);
    /**
     * Print the errors during compilation.
     * @param os stream to print.
     * @param opt options.
     */
    printError(os: OutputStream, opt?: ErrPrintOption);
    /**
     * Print the warnings during compilation.
     * @param os stream to print.
     * @param opt options.
     */
    printWarning(os: OutputStream, opt?: ErrPrintOption);
    /**
     * Print a list of detailed time cost of different compilation phases, i.e.,
     * the elapsed time of the processes timed by `beginTime()` and `endTime()`.
     * @param os stream to print.
     */
    printDetailedTime(os: OutputStream);
    /**
     * Whether warnings are generated.
     * @returns `true` if no warning, otherwise `false`.
     */
    hasWarning(): boolean;
    /**
     * Whether errors are generated.
     * @returns `true` if no error, otherwise `false`.
     */
    hasError(): boolean;
    /**
     * Print the numbers of warnings and errors. 
     * @returns string of the form "xx warning(s), xx error(s)"
     */
    warningSummary(): string;
    /**
     * Whether the compilation was terminated due to errors.
     * @returns `true` if compilation was terminated, and `false` if compilation was complete.
     */
    isTerminated(): boolean;
    
    /**
     * Parse the given input using the generated parse table. 
     * @param tokens An array of tokens to be parsed. An element of the form `<...>` will be treated
     * as name of a token, otherwise alias of a token.
     * @param onErr Callback to handle errors.
     * @returns Parsing steps. Each step is a string with a `|` to indicate the top of the stack, while 
     * other elements could be a string (alias of a token), an identifier parenthesised by `<>` (name of 
     * a token), or an identifier (a non terminal).
     */
    testParse(tokens: string[], onErr: (msg: string) => any): string[];
    /**
     * generate code for the target parser.
     * @param fc An interface object to create files.
     */
    genCode(fc: FileCreator);
}
/**
 * Create a context object. This object allows you to call all the functions of tscc-compiler.
 * It is a more advanced way to use tscc-compiler as a module.
 * @returns context object.
 */
export declare function createContext(): TSCCContext;

export namespace highlight {
    interface Position{
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    }
    interface JNode extends Position{
        val: string;
        ext?: any;
    }
    interface ParserInput {
        current(): number;
        next();
        isEof(): boolean;
        backup(s: string);
    }
    interface ParserState {
        lexState: number[];
        lrState: number[];
        sematicS: JNode[];
    }
    export enum TokenType {
        EOF = 1,
        NONE,
        ERROR,
        STRING,
        NAME,
        COMMENT,
        DIRECTIVE,
        PUNCTUATION,
        CODE,
        TOKEN_IN_CODE
    }
    interface HighlightContext {
        load(input: ParserInput | string);
        nextToken(): TokenType;
        loadState(state: ParserState);
        getState(): ParserState;
    }
    export function createHighlightContext(): HighlightContext;
    export function highlightString(s: string, getClass: (t: TokenType) => string): string;
}