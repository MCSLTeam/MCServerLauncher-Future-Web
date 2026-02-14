import { defineConfig } from "@rsbuild/core";
import { config } from "@repo/shared/rsbuild.config";

export default defineConfig({
  ...config,
  html: {
    ...config.html,
    title: "MCSL Future Web",
  },
  source: {
    ...config.source,
    entry: {
      index: "./src-frontend/index.ts",
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:11451",
    },
  },
});
