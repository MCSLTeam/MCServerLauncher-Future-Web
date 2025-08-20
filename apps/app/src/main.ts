import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import { createI18n, type I18nOptions } from "vue-i18n";
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
  const i18n = createI18n((await useLocale().generateConfig()) as I18nOptions);
  app.use(i18n);
  load(<any>i18n.global);
  app.mount("#app");
})();
