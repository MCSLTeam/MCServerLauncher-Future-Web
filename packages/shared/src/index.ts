import { loadUi } from "@repo/ui/src";
import { type Component, computed, createApp, ref } from "vue";
import { createPinia } from "pinia";
import FloatingVue from "floating-vue";
import { createI18n } from "vue-i18n";
import { useLocale } from "@repo/ui/src/utils/stores.ts";
import router from "./router.ts";
import dayjs from "dayjs";
import axios from "axios";
import { useSettings } from "./utils/stores.ts";

type Platform = "web" | "app";

export let platform: Platform = "web";
export let close: () => any = () => {};

export function setPlatform(p: Platform) {
  platform = p;
  document.documentElement.classList.add(platform);
}

export function setCloseWindow(c: () => any) {
  close = c;
}

export const versionCodename = import.meta.env.APP_VERSION_NAME;
export const version =
  import.meta.env.APP_VERSION +
  (platform == "web"
    ? import.meta.env.APP_VERSION_WEB
    : import.meta.env.APP_VERSION_APP) +
  (import.meta.env.DEV ? "-dev" : "");
export const buildTime = dayjs(import.meta.env.BUILD_TIME);
export const commitBranch = import.meta.env.COMMIT_BRANCH;
export const commitHash = import.meta.env.COMMIT_HASH;

export const windowButtonsExists = ref(false);
export const windowButtonTransition = computed(
  () => `0.3s ${windowButtonsExists.value ? "" : "0.5s"} ease-in-out`,
);

export const loading = ref(true);
export const loadingStep = ref("");

export const showCreateInstanceModal = ref(false);

export async function load(
  appComponent: Component,
  load: () => void | Promise<void>,
) {
  const app = createApp(appComponent);
  app.use(createPinia());
  app.use(FloatingVue, {
    themes: {
      tooltip: {
        hideTriggers: (events: string[]) => events, // 点击后不隐藏tooltip
        overflowPadding: 1,
      },
    },
  });
  app.use(router);

  const i18n = createI18n(await useLocale().generateConfig());
  app.use(i18n);
  useLocale().injectI18n(i18n.global as any);

  app.mount("#app");

  await useSettings().load();

  await loadUi();

  await load();

  loading.value = false;
  loadingStep.value = useLocale().getI18n().t("ui.loading.success");
}

let eula: string | undefined = undefined;
export async function getEula() {
  if (eula) return eula;
  const t = useLocale().getI18n().t;
  try {
    eula = (await axios.get(t("shared.eula.url"), { timeout: 5000 })).data;
  } catch {
    console.warn("Failed to fetch EULA content from GitHub, using mirror");
    try {
      eula = (await axios.get(t("shared.eula.mirror"), { timeout: 5000 })).data;
    } catch {
      console.warn("Failed to fetch EULA content from mirror, using default");
      eula = t("shared.eula.content");
    }
  }
  eula = eula?.replace(/^---[\s\S]*?---\s*/, "");
  return eula;
}
