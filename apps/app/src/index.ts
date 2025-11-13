import { load, windowButtonsExists } from "@repo/shared/src";
import { platform } from "@tauri-apps/plugin-os";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ref, watchEffect } from "vue";
import App from "./App.vue";
import router from "@repo/shared/src/router.ts";

export const fullscreen = ref(false);

(async () => {
  const win = getCurrentWindow();
  const refresh = async () => {
    fullscreen.value = await win.isFullscreen();
  };
  await win.onResized(refresh);
  await refresh();

  if (platform() == "macos") {
    watchEffect(() => {
      windowButtonsExists.value = !fullscreen.value;
    });
  } else {
    windowButtonsExists.value = true;
  }

  router.addRoute({
    path: "/",
    redirect: "/dashboard",
  });

  await load("app", App);
})();
