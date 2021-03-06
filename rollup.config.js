import ts from 'rollup-plugin-typescript2';
import sourcemaps from 'rollup-plugin-sourcemaps';
import typescript from 'typescript';

export default {
    input: './src/main.ts',
    output:[
        {
            format: 'umd',
            name: 'tscc',
            file: 'lib/tscc.js',
            sourcemap: true
        }
    ],
    plugins:[
        sourcemaps(),
        ts({
            typescript: typescript
        })
    ]
}