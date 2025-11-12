import { load, windowButtons, windowButtonsExists } from "@repo/shared/src";
import { platform } from "@tauri-apps/plugin-os";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { exit } from "@tauri-apps/plugin-process";
import { ref, watch } from "vue";

(async () => {
  const win = getCurrentWindow();
  if (platform() == "macos") {
    const refresh = async () => {
      windowButtonsExists.value = !(await win.isFullscreen());
    };
    await win.onResized(refresh);
    await refresh();
  } else {
    const fullscreen = ref(await win.isFullscreen());
    watch(fullscreen, (value) => {
      win.setFullscreen(value);
    });
    windowButtons.value = {
      close: async () => {
        await exit();
      },
      minimize: async () => {
        await win.minimize();
      },
      fullscreen: fullscreen,
    };
    windowButtonsExists.value = true;
  }

  load("app");
})();
