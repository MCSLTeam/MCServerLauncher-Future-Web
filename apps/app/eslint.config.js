import vueConfig from "@repo/configs/eslint/vue.js";

export default [
  ...vueConfig,
  {
    ignores: ["dist/**/*"],
  },
];
