import { loadUi } from "@repo/ui/src";
import { computed, createApp, type Ref, ref } from "vue";
import { createPinia } from "pinia";
import FloatingVue from "floating-vue";
import { createI18n } from "vue-i18n";
import { useLocale } from "@repo/ui/src/utils/stores.ts";
import App from "./App.vue";
import router from "./router.ts";

type Platform = "web" | "app";

let platform: Platform = "web";

export const windowButtons = ref<{
  close: () => Promise<void>;
  minimize: () => Promise<void>;
  fullscreen: Ref<boolean>;
}>();
export const windowButtonsExists = ref(false);
export const windowButtonTransition = computed(
  () => `0.3s ${windowButtonsExists.value ? "" : "0.5s"} ease-in-out`,
);

export function getPlatform(): Platform {
  return platform;
}

export async function load(p: Platform) {
  platform = p;

  const app = createApp(App);
  const pinia = createPinia();
  app.use(FloatingVue);
  app.use(pinia);
  app.use(router);

  const i18n = createI18n(await useLocale().generateConfig());
  app.use(i18n);
  useLocale().injectI18n(i18n.global as any);

  loadUi();

  app.mount("#app");
}
