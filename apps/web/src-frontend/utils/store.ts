import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useLocalStorage, useSessionStorage } from "@vueuse/core";
import { notifyErr, requestWithToken } from "./network.ts";
import router from "@repo/shared/src/router.ts";
import { useLocale } from "@repo/ui/src/utils/stores.ts";
import { type PageNavigationInfo } from "@repo/ui/src/utils/utils.ts";
import {
  showTaskExitDialog,
  showUserCenterModal,
  userCenterPage,
} from "../index.ts";
import type { UserInfo } from "./types.ts";

/* ========== [ 账号 ]========== */
export const useAccount = defineStore("account", () => {
  const tokenPermanent = useLocalStorage<string | null>("mcsl-web-token", null);
  const tokenTemporary = useSessionStorage<string | null>(
    "mcsl-web-token",
    null,
  );

  const token = computed(() => {
    return tokenPermanent.value ?? tokenTemporary.value;
  });

  async function setToken(token: string | null, isPermanent?: boolean) {
    if (isPermanent === true || isPermanent == undefined) {
      tokenPermanent.value = token;
    }
    if (isPermanent === false || isPermanent == undefined) {
      tokenTemporary.value = token;
    }
    await updateSelfInfo();
  }

  async function logout(clearSessions: boolean = true) {
    if (!token.value) return;

    showUserCenterModal.value = false;
    showTaskExitDialog.value = false;

    try {
      await requestWithToken<void>("/account/logout", "GET", (err) => {
        if (clearSessions) notifyErr(err, "web.auth.logout.error", "warning");
      });
    } catch {
      /* ignored */
    }

    await setToken(null);
    await router.push("/auth");
  }

  const selfInfo = ref<UserInfo | null>(null);

  async function updateSelfInfo() {
    if (!token.value) {
      selfInfo.value = null;
      return;
    }
    try {
      selfInfo.value = await requestWithToken<UserInfo>(
        "/user/info/self",
        "GET",
        (err) => notifyErr(err, "web.user-center.user-fetch-error"),
      );
    } catch {
      /* ignore */
    }
  }

  return {
    setToken,
    token,
    logout,
    selfInfo: computed(() => selfInfo.value!),
    updateSelfInfo,
  };
});

/* ========== [ 页面导航 ]========== */
export type NavigationType = "userCenter";
export const useWebNavigation = defineStore("webNavigation", () => {
  const t = useLocale().getI18n().t;

  const items = ref<Record<NavigationType, PageNavigationInfo[]>>({
    userCenter: [
      {
        label: t("web.user-center.user-info.title"),
        icon: "fa fa-user",
        async onClick() {
          userCenterPage.value = [
            "UserInfo",
            (await import("../components/userCenter/UserInfo.vue")).default,
          ];
        },
        isSubpage() {
          return userCenterPage.value?.[0] == "UserInfo";
        },
      },
      {
        label: t("web.user-center.permissions.title"),
        icon: "fa fa-lock-open",
        async onClick() {
          userCenterPage.value = [
            "Permissions",
            (await import("../components/userCenter/Permissions.vue")).default,
          ];
        },
        isSubpage() {
          return userCenterPage.value?.[0] == "Permissions";
        },
      },
      {
        label: t("web.user-center.sessions.title"),
        icon: "fa fa-desktop",
        async onClick() {
          userCenterPage.value = [
            "Sessions",
            (await import("../components/userCenter/Sessions.vue")).default,
          ];
        },
        isSubpage() {
          return userCenterPage.value?.[0] == "Sessions";
        },
      },
    ],
  });

  function add(type: NavigationType, item: PageNavigationInfo, index: number) {
    items.value[type].splice(index, 0, item);
  }

  function get(type: NavigationType) {
    return computed(() => items.value[type]);
  }

  return {
    get,
    add,
  };
});
