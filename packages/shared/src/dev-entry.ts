import { load } from "./index.ts";
import App from "./App.vue";
import router from "./router.ts";

(async () => {
  router.addRoute({
    path: "/",
    redirect: "/dashboard",
  });

  load(
    "web",
    () => {
      window.close();
      location.replace("about:blank");
      document.body.innerHTML = "";
    },
    App,
  );
})();
