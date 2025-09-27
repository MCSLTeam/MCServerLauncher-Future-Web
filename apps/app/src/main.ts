import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import { useLocale } from "@repo/ui/src/utils/stores.ts";
import { load } from "@repo/shared/src";
import router from "./router.ts";
import FloatingVue from "floating-vue";

(async () => {
  const app = createApp(App);
  const pinia = createPinia();
  app.use(FloatingVue);
  app.use(pinia);
  app.use(router);

  const i18n = createI18n(await useLocale().generateConfig());
  app.use(i18n);
  useLocale().injectI18n(i18n.global as any);

  load("app");

  app.mount("#app");
})();
