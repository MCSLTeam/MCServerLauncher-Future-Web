import { load } from "./index.ts";
import App from "./App.vue";
import router from "./router.ts";

(async () => {
  router.addRoute({
    path: "/",
    redirect: "/dashboard",
  });

  await load(
    "web",
    () => {
      window.close();
      location.replace("about:blank");
      document.body.innerHTML = "";
    },
    App,
    async () => {},
  );
})();
