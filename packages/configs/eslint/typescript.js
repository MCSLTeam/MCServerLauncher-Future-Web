import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
        languageOptions: {
            globals: {...globals.browser, ...globals.node},
            parserOptions: {parser: tseslint.parser},
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
        },
    },
    {
        ignores: ['node_modules/**/*'],
    },
]