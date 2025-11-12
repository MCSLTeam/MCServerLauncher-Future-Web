import { loadUi } from "@repo/ui/src";
import { createApp } from "vue";
import { createPinia } from "pinia";
import FloatingVue from "floating-vue";
import { createI18n } from "vue-i18n";
import { useLocale } from "@repo/ui/src/utils/stores.ts";
import App from "./App.vue";
import router from "./router.ts";

type Platform = "web" | "app";

let platform: Platform = "web";

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
