import { load, windowButtonsExists } from "@repo/shared/src";
import { platform } from "@tauri-apps/plugin-os";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ref, watchEffect } from "vue";
import App from "./App.vue";
import { exit } from "@tauri-apps/plugin-process";

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
    document.body.style.background = "transparent";
  }

  await load(
    "app",
    () => {
      exit();
    },
    App,
  );
})();
