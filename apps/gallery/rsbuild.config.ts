import { defineConfig } from "@rsbuild/core";
import { config } from "@repo/shared/rsbuild.config";

export default defineConfig({
  ...config,
  html: {
    ...config.html,
    title: "MCSL UI Gallery",
  },
  source: {
    ...config.source,
    entry: {
      index: "./src/index.ts",
    },
  },
});
