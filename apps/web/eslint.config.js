import vueConfig from '@repo/configs/eslint/vue.js'
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
    ...vueConfig,
    {
        ignores: ['.nuxt/**/*'],
    },
);
