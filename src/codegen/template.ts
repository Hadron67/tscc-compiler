import { TemplateInput, TemplateOutput } from './def';
import { OutputStream } from '../util/io';

import tsRender from './templates/ts';

interface FileCreator extends TemplateOutput{
    save(ext: string);
    write(s: string);
    writeln(s: string);
};

var templates: {[s: string]: (input: TemplateInput, fc: FileCreator) => any} = {};

export function defineTemplate(name: string, render: (input: TemplateInput, fc: FileCreator) => any){
    templates[name] = render;
}

export function generateCode(lang: string, input: TemplateInput, fc: FileCreator){
    templates[lang](input, fc);
}

defineTemplate('typescript', (input, fc) => {
    tsRender(input, fc);
    fc.save('.ts');
});