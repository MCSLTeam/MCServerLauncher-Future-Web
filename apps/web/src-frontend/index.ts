import {
  load,
  loadingStep,
  setCloseWindow,
  setPlatform,
} from "@repo/shared/src";
import App from "./App.vue";
import router from "@repo/shared/src/router.ts";
import { useAccount } from "./utils/store.ts";
import { requestApi } from "./utils/network.ts";
import { useLocale } from "@repo/ui/src/utils/stores.ts";
import { sleep } from "@repo/ui/src/utils/utils.ts";
import { ref, watchEffect } from "vue";
import { tasks } from "@repo/shared/src/utils/tasks.ts";
import { useLocalStorage } from "@vueuse/core";
import { useNavigation } from "@repo/shared/src/utils/stores.ts";
import { MCSLNotif } from "@repo/ui/src/utils/notifications.ts";

let shouldRegister = false;

export const disableTaskExitDialog = useLocalStorage(
  "disable-task-exit",
  false,
);
export const showTaskExitDialog = ref(false);
let taskExitDialogShown = false;

export function setShouldRegister(value: boolean) {
  shouldRegister = value;
}

(async () => {
  setPlatform("web");
  setCloseWindow(() => {
    window.close();
    location.replace("about:blank");
    document.body.innerHTML = "";
  });

  await load(App, async () => {
    router.addRoute({
      path: "/auth",
      name: "Auth",
      redirect: () => (shouldRegister ? "/auth/register" : "/auth/login"),
    });

    router.addRoute({
      path: "/auth/register",
      name: "Auth - Register",
      component: () => import("./views/Register.vue"),
    });

    router.addRoute({
      path: "/auth/login",
      name: "Auth - Login",
      component: () => import("./views/Login.vue"),
    });

    watchEffect(() => {
      if (
          tasks.value.length > 0 &&
          !disableTaskExitDialog.value &&
          !taskExitDialogShown
      ) {
        showTaskExitDialog.value = taskExitDialogShown = true;
      }
    });

    window.addEventListener("beforeunload", (e) => {
      if (tasks.value.length > 0) {
        e.preventDefault();
      }
    });
  }, async () => {
    const t = useLocale().getI18n().t;
    useNavigation().addItem(
      "sidebarUpper",
      {
        label: t("web.users.title"),
        icon: "fa fa-users",
        link: "/users",
      },
      3,
    );

    useNavigation().addItem(
      "navbar",
      {
        label: t("web.user-center.title"),
        icon: "fa fa-user",
        onClick() {},
      },
      1,
    );

    loadingStep.value = t("web.loading.connect-backend");

    try {
      shouldRegister = await requestApi<boolean>(
        "/account/should-register",
        "GET",
        (err) => {
          new MCSLNotif({
            duration: 0,
            data: {
              color: "danger",
              closeable: false,
              title: t("ui.notification.title.error"),
              message: t("web.loading.connect-backend-error", {
                reason: err.message,
              }),
            },
          }).open();
        },
      );
    } catch {
      // 阻塞直到刷新页面重试
      while (true) await sleep(1000);
    }

    router.beforeEach((to, _from, next) => {
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

    if (
      !useAccount().accessToken &&
      !router.currentRoute.value.path.startsWith("/auth") &&
      !router.currentRoute.value.path.startsWith("/welcome")
    )
      await router.push("/auth");

    loadingStep.value = t("web.loading.fetch-user");

    await useAccount().updateSelfInfo();
    setInterval(
      async () => {
        // 刷新权限
        await useAccount().updateSelfInfo();
      },
      1000 * 60 * 5,
    );

    loadingStep.value = "";
  });
})();
