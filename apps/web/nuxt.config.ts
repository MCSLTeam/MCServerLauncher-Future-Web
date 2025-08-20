// https://nuxt.com/docs/api/configuration/nuxt-config

import dynamicImport from "vite-plugin-dynamic-import";

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
  app: {
    head: {
      noscript: [
        {
          innerHTML:
            '<div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: white; color: red; display: flex; justify-content: center; align-items: center; font-size: larger; font-weight: bold">MCSL Future Web requires JavaScript to run!</div>',
        },
      ],
    },
    pageTransition: {
      name: "fade",
      mode: "out-in",
    },
    layoutTransition: {
      name: "blur",
      mode: "out-in",
    },
  },
  ssr: false,
  imports: {
    autoImport: false,
  },
  i18n: {
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
  vite: {
    plugins: [
      dynamicImport({
        filter(id) {
          if (id.includes("/node_modules/@repo")) {
            return true;
          }
        },
      }),
    ],
  },
});
