import { pluginVue } from "@rsbuild/plugin-vue";
import { pluginSass } from "@rsbuild/plugin-sass";
import { pluginSvg } from "rsbuild-plugin-svg";
import { defineConfig, type RsbuildConfig } from "@rsbuild/core";
import pkg from "../../package.json";

export const config: RsbuildConfig = {
  plugins: [
    pluginVue(),
    pluginSass(),
    pluginSvg({
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
    }),
  ],
  source: {
    define: {
      "import.meta.env.APP_VERSION_NAME": JSON.stringify(pkg.versions.codename),
      "import.meta.env.APP_VERSION": JSON.stringify(pkg.versions.version),
      "import.meta.env.APP_VERSION_APP": JSON.stringify(pkg.versions.app),
      "import.meta.env.APP_VERSION_WEB": JSON.stringify(pkg.versions.web),
    },
  },
  html: {
    favicon: "../../packages/shared/src/assets/MCSL.png",
    title: "MCSL Future Web-like",
    mountId: "app",
  },
};

export default defineConfig({
  ...config,
  source: {
    ...config.source,
    entry: {
      index: "./src/dev-entry.ts",
    },
  },
});
