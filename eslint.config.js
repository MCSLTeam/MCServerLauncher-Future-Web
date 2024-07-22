import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	...pluginVue.configs['flat/essential'],
	{
		files: ['**/*.{js,mjs,cjs,ts,vue}'],
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parserOptions: { parser: tseslint.parser },
		},
		rules: {
			'vue/multi-word-component-names': 'off',
			'vue/valid-template-root': 'warn',
			'vue/no-multiple-template-root': 'warn',
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
	{
		ignores: ['.nuxt/**/*', 'node_modules/**/*'],
	},
);
