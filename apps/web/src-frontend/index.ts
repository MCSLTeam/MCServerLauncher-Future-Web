import { load } from "@repo/shared/src";
import App from "@repo/shared/src/App.vue";
import router from "@repo/shared/src/router.ts";
import { useAccount } from "./utils/store.ts";
import { requestApi } from "./utils/network.ts";

(async () => {
  await load(
    "web",
    () => {
      window.close();
      location.replace("about:blank");
      document.body.innerHTML = "";
    },
    App,
  );

  let shouldRegister = false;

  try {
    shouldRegister = await requestApi<boolean>(
      "/account/should-register",
      "GET",
    );
  } catch {
    /* ignore */
  }

  router.addRoute({
    path: "/auth",
    redirect: shouldRegister ? "/auth/register" : "/auth/login",
  });

  router.beforeEach(async (to, _from, next) => {
    if (useAccount().accessToken) {
      if (to.path.startsWith("/auth")) next("/");
    } else {
      if (!to.path.startsWith("/auth") && !to.path.startsWith("/welcome"))
        next("/auth");
    }

    if (shouldRegister) {
      if (to.path.startsWith("/auth/login")) next("/auth/register");
    } else {
      if (to.path.startsWith("/auth/register")) next("/auth/login");
    }

    next();
  });
})();
