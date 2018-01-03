export enum Assoc {
    UNDEFINED = 0,
    LEFT,
    RIGHT,
    NON
};
export interface TokenDef{
    index: number,
    sym: string,
    alias: string,
    line: number,
    pr: number,
    assoc: Assoc,
    used: boolean,
}
export interface TokenEntry{
    tokenCount: number;
    tokens: TokenDef[];
    isToken(t: number): boolean;
}
export function convertTokenToString(t: TokenDef): string{
    return t.alias === null ? `<${t.sym}>` : `"${t.alias}"`;
}