import { pluginVue } from "@rsbuild/plugin-vue";
import { pluginSass } from "@rsbuild/plugin-sass";
import { pluginSvg } from "rsbuild-plugin-svg";
import { defineConfig, type RsbuildConfig } from "@rsbuild/core";

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
  html: {
    favicon: "../../packages/shared/src/assets/MCSL.png",
    title: "MCSL Future Web-like",
    mountId: "app",
  },
};

export default defineConfig({
  ...config,
  source: {
    entry: {
      index: "./src/dev-entry.ts",
    },
  },
});
