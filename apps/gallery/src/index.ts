import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import FloatingVue from "floating-vue";
import App from "./App.vue";
import router from "./router";
import { loadUi } from "@repo/ui/src/index";
import { useLocale } from "@repo/ui/src/utils/stores";

(async () => {
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);

  const localeStore = useLocale();
  const i18n = createI18n(await localeStore.generateConfig());
  app.use(i18n);
  localeStore.injectI18n(i18n.global as any);

  app.use(FloatingVue, {
    themes: {
      tooltip: {
        hideTriggers: (events: string[]) => events,
        overflowPadding: 1,
      },
    },
  });
  app.use(router);
  await loadUi();
  app.mount("#app");
})();
