import { TemplateInput, TemplateOutput } from './def';
import { OutputStream } from '../util/io';

import tsRenderer from './templates/ts';

export interface FileCreator extends TemplateOutput{
    save(fname: string);
    write(s: string);
    writeln(s: string);
};

var templates: {[s: string]: (input: TemplateInput, fc: FileCreator) => any} = {};

export function defineTemplate(name: string, render: (input: TemplateInput, fc: FileCreator) => any){
    templates[name] = render;
}

export function generateCode(lang: string, input: TemplateInput, fc: FileCreator){
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
export function listTemplates(): string[]{
    return Object.keys(templates);
}

defineTemplate('typescript', (input, fc) => {
    tsRenderer(input, fc);
    fc.save(`${input.file.name}.ts`);
});
defineTemplate('javascript', (input, fc) => {
    tsRenderer(input, fc);
    fc.save(`${input.file.name}.js`);
});