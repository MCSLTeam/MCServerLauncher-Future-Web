import pluginVue from 'eslint-plugin-vue';
import typescript from "./typescript.js";

export default [
    ...typescript,
    ...pluginVue.configs['flat/essential'],
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            'vue/multi-word-component-names': 'off',
            'vue/valid-template-root': 'warn',
            'vue/no-multiple-template-root': 'warn',
            'vue/first-attribute-linebreak': 'off',
        },
    }
]