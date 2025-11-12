import { defineConfig } from "@rsbuild/core";
import config from "@repo/shared/rsbuild.config";

export default defineConfig({
  ...config,
  html: {
    title: "MCSL Future UI Test",
    mountId: "app",
  },
});
