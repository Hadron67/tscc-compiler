import { TemplateInput, TemplateOutput } from './def';
import { OutputStream } from '../util/io';

import tsRenderer from './templates/ts';

interface FileCreator extends TemplateOutput{
    save(ext: string);
    write(s: string);
    writeln(s: string);
};

var templates: {[s: string]: (input: TemplateInput, fc: FileCreator) => any} = {};

export function defineTemplate(name: string, render: (input: TemplateInput, fc: FileCreator) => any){
    templates[name] = render;
}

export function generateCode(lang: string, input: TemplateInput, fc: FileCreator, cb: (err: string) => any){
    let g = templates[lang];
    if(g === undefined){
        throw (`template for language "${lang}" is not implemented yet`);
    }
    else {
        templates[lang](input, fc);
    }
}

export function templateExists(t: string){
    return templates[t] !== undefined;
}

defineTemplate('typescript', (input, fc) => {
    tsRenderer(input, fc);
    fc.save('.ts');
});