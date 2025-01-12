import { createApp } from "vue";
import App from "./App.vue";
import ElementPlus from "element-plus";
import { createPinia } from "pinia";
import { agreedEula, loadApp } from "@repo/commons/src/utils/loader";
import { setRouter } from "@repo/commons/src/utils/globals";
import router from "./router";
import { createI18n } from "vue-i18n";
import { useLocale } from "@repo/commons/src/utils/uses";
import { type } from "@tauri-apps/plugin-os";

(async () => {
  const app = createApp(App);
  app.use(router);
  app.use(ElementPlus);
  const pinia = createPinia();
  app.use(pinia);

  const messages: any = {};
  const localeStore = useLocale(pinia);
  for (const locale of localeStore.locales) {
    messages[locale] = (await import(`./assets/i18n/${locale}.json`)).default;
  }
  const i18n = createI18n(await useLocale().getConfig(messages));

  return {
    app,
    i18n,
  };
})().then(async ({ app, i18n }) => {
  app.use(i18n);
  setRouter(router);
  app.mount("#app");
  await loadApp(async (loadingInfo) => {
    loadingInfo.setMessage("loading.default");
    const os = type();
    if (os == "macos") {
      document.body.classList.add("tauri-macos");
    } else if (os == "windows" || os == "linux") {
      document.body.classList.add("tauri-desktop");
    } else {
      document.body.classList.add("tauri-mobile");
    }
    if (!agreedEula.value) await router.push("/welcome/welcome");
  });
});