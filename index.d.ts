declare abstract class OutputStream {
    abstract write(s: string | number);
    writeln(s: string | number);
}
interface TSCCOptions{
    /**
     * file name (path) of the grammar file
     */
    inputFile: string;
    /**
     * content of the input grammar file
     */
    input: string;
    /**
     * name (path) of the output file, if not present, the output file won't be generated
     */
    outputFile?: string;

    // interface
    stdout: OutputStream;
    writeFile(path: string, content: string): any;

    // options
    testInput?: string;
    printDetailedTime: boolean;
}
export declare function main(opt: TSCCOptions);