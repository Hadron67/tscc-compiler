import { Locatable } from "../util/located";
import { Position } from "../parser/node";

export enum Assoc {
    UNDEFINED = 0,
    LEFT,
    RIGHT,
    NON
};
export interface TokenDef {
    index: number,
    sym: string,
    alias: string,
    pr: number,
    assoc: Assoc,
    used: boolean,
    appears: Position[]
}
export interface TokenEntry{
    tokenCount: number;
    tokens: TokenDef[];
    isToken(t: number): boolean;
}
export function convertTokenToString(t: TokenDef): string{
    return t.alias === null ? `<${t.sym}>` : `"${t.alias}"`;
}