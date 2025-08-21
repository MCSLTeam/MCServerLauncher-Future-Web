import pluginVue from "eslint-plugin-vue";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export const customVueConfig = [
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.es2020 },
      parserOptions: { parser: tseslint.parser },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "vue/multi-word-component-names": "off",
      "vue/valid-template-root": "warn",
      "vue/no-multiple-template-root": "off",
      "vue/first-attribute-linebreak": "off",
      "vue/ html-self-closing": "off", // 交给 prettier 处理
    },
  },
  {
    ignores: ["node_modules/**/*", "dist/**/*", ".nuxt/**/*", ".output/**/*"],
  },
];

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  ...customVueConfig,
];
