import pluginVue from 'eslint-plugin-vue';
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    ...pluginVue.configs['flat/essential'],
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
        languageOptions: {
            globals: {...globals.browser, ...globals.node, ...globals.es2020,},
            parserOptions: {parser: tseslint.parser},
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            'vue/multi-word-component-names': 'off',
            'vue/valid-template-root': 'warn',
            'vue/no-multiple-template-root': 'warn',
            'vue/first-attribute-linebreak': 'off',
        },
    },
    {
        ignores: ['node_modules/**/*'],
    },
]