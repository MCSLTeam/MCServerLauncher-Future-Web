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
      "import.meta.env.IS_ACTION_BUILD": JSON.stringify(
        process.env.IS_ACTION_BUILD === "true",
      ),
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
        tag: "style",
        head: true,
        append: false,
        children:
          "html,body,#app{width:100%;height:100%;margin:0;background:#f8fafc;color-scheme:light;}html.dark,html.dark body,html.dark #app{background:#09090b;color-scheme:dark;}html.light,html.light body,html.light #app{background:#f8fafc;color-scheme:light;}",
      },
      {
        tag: "script",
        head: true,
        append: false,
        children:
          "(()=>{try{const t=localStorage.getItem('theme')||'system';const d=window.matchMedia('(prefers-color-scheme: dark)').matches;const isDark=t==='dark'||t==='\"dark\"'||((t==='system'||t==='\"system\"')&&d);const c=isDark?'dark':'light';document.documentElement.classList.remove(isDark?'light':'dark');document.documentElement.classList.add(c);document.documentElement.style.colorScheme=c;}catch(e){}})();",
      },
    ],
  },
};
