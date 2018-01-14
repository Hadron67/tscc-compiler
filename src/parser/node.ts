export interface Position{
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}
export interface JNode extends Position{
    val: string;
    ext: any;
}