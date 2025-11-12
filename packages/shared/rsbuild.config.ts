import { pluginVue } from "@rsbuild/plugin-vue";
import { pluginSass } from "@rsbuild/plugin-sass";
import { pluginSvg } from "rsbuild-plugin-svg";
import { defineConfig } from "@rsbuild/core";

export const config = {
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
    title: "MCSL Future Web-like",
    mountId: "app",
  },
};

export default defineConfig(config)
