import { load } from "@repo/shared/src";
import App from "@repo/shared/src/App.vue";
import router from "@repo/shared/src/router.ts";
import { useAccount } from "./utils/store.ts";

(async () => {
  await load("web", App);

  router.beforeEach((to, _from, next) => {
    if (useAccount().loggedIn) {
      if (to.path.startsWith("/auth")) {
        next("/");
      }
    } else {
      if (!to.path.startsWith("/auth") && !to.path.startsWith("/welcome")) {
        next("/auth");
      }
    }

    next();
  });
})();
