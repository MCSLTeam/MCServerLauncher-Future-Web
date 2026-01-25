import { pluginVue } from "@rsbuild/plugin-vue";
import { pluginSass } from "@rsbuild/plugin-sass";
import { pluginSvg } from "rsbuild-plugin-svg";
import { type RsbuildConfig } from "@rsbuild/core";
import pkg from "../../package.json";
import { execSync } from "node:child_process";

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
      "import.meta.env.BUILD_TIME": JSON.stringify(new Date().toISOString()),
      "import.meta.env.COMMIT_HASH": JSON.stringify(
        execSync("git rev-parse HEAD").toString().trim(),
      ),
      "import.meta.env.COMMIT_BRANCH": JSON.stringify(
        execSync("git rev-parse --abbrev-ref HEAD").toString().trim(),
      ),
    },
  },
  html: {
    favicon: "../../packages/shared/src/assets/img/MCSL.png",
    title: "MCSL Future Web-like",
    mountId: "app",
    tags: [
      {
        tag: "link",
        attrs: {
          rel: "stylesheet",
          href: "https://cdn-font.hyperos.mi.com/font/css?family=MiSans_VF:VF:Latin,Chinese_Simplify,Chinese_Traditional_TW&display=swap",
        },
      },
    ],
  },
};
