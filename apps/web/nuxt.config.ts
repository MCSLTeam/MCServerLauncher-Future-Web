// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/eslint",
    "@nuxtjs/i18n",
    "@pinia/nuxt",
    "floating-vue/nuxt",
    "nuxt-svgo-loader",
  ],
  imports: {
    autoImport: false,
  },
  i18n: {
    vueI18n: "./app/i18n.config.ts",
    strategy: "no_prefix",
  },
  svgoLoader: {
    svgoConfig: {
      plugins: [
        {
          name: "preset-default",
          params: {
            overrides: {
              removeViewBox: false,
            },
          },
        },
      ],
    },
  },
});
