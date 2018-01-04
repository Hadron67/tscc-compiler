import { Locatable } from "../util/located";

export enum Assoc {
    UNDEFINED = 0,
    LEFT,
    RIGHT,
    NON
};
export interface TokenDef extends Locatable{
    index: number,
    sym: string,
    alias: string,
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