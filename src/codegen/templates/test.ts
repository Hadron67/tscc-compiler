import { TemplateInput, TemplateOutput } from '../def';
import { Item, Action } from '../../grammar/item-set';
import { Rule } from '../../grammar/grammar';
import { TokenDef } from '../../grammar/token-entry';
import { CodeGenerator } from '../code-generator';
import { DFA } from '../../lexer/dfa';
import { LexAction } from '../../lexer/action';
import { State, Arc } from '../../lexer/state';
import { Inf } from '../../util/interval-set';
import { JNode } from '../../parser/node'

export default function(input: TemplateInput, output: TemplateOutput){
    function echo(s: string){
    output.write(s);
}
function echoLine(s: string){
    output.writeln(s);
} 
    echoLine("");
    echo("let a = [");
    for(let i = 0; i < 10; i++){ 
    echo("    a");
    echo(i.toString() );
    } 
    echoLine("");
    echo("];");
    

}