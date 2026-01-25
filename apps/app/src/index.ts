import {
  load,
  setCloseWindow,
  setPlatform,
  windowButtonsExists,
} from "@repo/shared/src";
import { platform } from "@tauri-apps/plugin-os";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ref, watchEffect } from "vue";
import App from "./App.vue";
import { setSystemNotif } from "@repo/ui/src/utils/notifications.ts";
import {
  isPermissionGranted,
  requestPermission as requestNotificationPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { exit } from "@tauri-apps/plugin-process";

export const fullscreen = ref(false);

(async () => {
  setPlatform("app");
  setCloseWindow(() => {
    exit();
  });

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

  let notifPermission: "default" | "denied" | "granted" =
    (await isPermissionGranted()) ? "granted" : "default";
  setSystemNotif({
    supported: true,
    async requestPermission() {
      notifPermission = await requestNotificationPermission();
    },
    isPermissionGranted() {
      return notifPermission;
    },
    send(title: string, body: string) {
      sendNotification({
        title,
        body,
      });
      return undefined;
    },
  });

  await load(App, async () => {});
})();
