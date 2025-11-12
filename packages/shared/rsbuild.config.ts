import { pluginVue } from "@rsbuild/plugin-vue";
import { pluginSass } from "@rsbuild/plugin-sass";
import { pluginSvg } from "rsbuild-plugin-svg";

export default {
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
};
