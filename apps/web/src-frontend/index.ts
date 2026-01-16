import { load, loadingStep } from "@repo/shared/src";
import App from "@repo/shared/src/App.vue";
import router from "@repo/shared/src/router.ts";
import { useAccount } from "./utils/store.ts";
import { requestApi } from "./utils/network.ts";
import { useLocale } from "@repo/ui/src/utils/stores.ts";
import { MCSLNotif } from "@repo/ui/src/utils/notifications.ts";
import { sleep } from "@repo/ui/src/utils/utils.ts";

(async () => {
  await load(
    "web",
    () => {
      window.close();
      location.replace("about:blank");
      document.body.innerHTML = "";
    },
    App,
    async () => {
      const t = useLocale().getI18n().t;
      loadingStep.value = t("web.loading.connect-backend");

      let shouldRegister = false;

      try {
        shouldRegister = await requestApi<boolean>(
          "/account/should-register",
          "GET",
        );
      } catch {
        new MCSLNotif({
          duration: 0,
          data: {
            color: "danger",
            closeable: false,
            title: t("ui.notification.title.error"),
            message: t("web.loading.connect-backend-error"),
          },
        }).open();

        while (true) {
          await sleep(1000);
        }
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

      loadingStep.value = "";
    },
  );
})();
