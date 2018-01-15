import { OutputStream } from "./io";

export interface Aligner{
    col(s: string): Aligner;
    row(): Aligner;
    writeTo(os: OutputStream): void;
};

export function align(spaces): Aligner{
    var rows: string[][] = [[]];
    return {
        col: function(s: string){
            return this;
        },
        row: function(){
            return this;
        },
        writeTo: function(os){

        }
    };
}