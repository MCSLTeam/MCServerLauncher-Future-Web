import { loadUi } from "@repo/ui/src";
import { type Component, computed, createApp, ref } from "vue";
import { createPinia } from "pinia";
import FloatingVue from "floating-vue";
import { createI18n } from "vue-i18n";
import { useLocale } from "@repo/ui/src/utils/stores.ts";
import router from "./router.ts";

type Platform = "web" | "app";

let platform: Platform = "web";
export let close: () => any = () => {};

export function setPlatform(p: Platform) {
  platform = p;
}

export function setCloseWindow(c: () => any) {
  close = c;
}

export const versionCodename = import.meta.env.APP_VERSION_NAME;
export const version =
  import.meta.env.APP_VERSION +
  (platform == "web"
    ? import.meta.env.APP_VERSION_WEB
    : import.meta.env.APP_VERSION_APP);

export const windowButtonsExists = ref(false);
export const windowButtonTransition = computed(
  () => `0.3s ${windowButtonsExists.value ? "" : "0.5s"} ease-in-out`,
);

export const loading = ref(true);
export const loadingStep = ref("");

export function getPlatform(): Platform {
  return platform;
}

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

  document.body.oncontextmenu = () => false;

  await loadUi();

  await load();

  loading.value = false;
  loadingStep.value = useLocale().getI18n().t("ui.loading.success");
}
