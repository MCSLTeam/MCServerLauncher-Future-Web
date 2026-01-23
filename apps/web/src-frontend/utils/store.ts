import { defineStore } from "pinia";
import { computed, ref } from "vue";
import {
  type Serializer,
  useLocalStorage,
  useSessionStorage,
} from "@vueuse/core";
import { notifyErr, requestApi, requestWithToken } from "./network.ts";
import { MCSLNotif } from "@repo/ui/src/utils/notifications.ts";
import { useLocale } from "@repo/ui/src/utils/stores.ts";
import router from "@repo/shared/src/router.ts";

export type TokenPair = { access_token: string; refresh_token: string };

export type UserInfo = {
  id: number;
  name: string;
  permissions: string[];
};

export const useAccount = defineStore("account", () => {
  const serializer: Serializer<TokenPair | null> = {
    write: (token: TokenPair | null) =>
      token == null ? "" : JSON.stringify(token),
    read: (token: string) =>
      token == "" ? null : (JSON.parse(token) as TokenPair),
  };

  const tokenPermanent = useLocalStorage<TokenPair | null>(
    "mcsl-web-token",
    null,
    { serializer },
  );
  const tokenTemporary = useSessionStorage<TokenPair | null>(
    "mcsl-web-token",
    null,
    { serializer },
  );

  const token = computed(() => {
    return tokenPermanent.value ?? tokenTemporary.value;
  });

  const accessToken = computed(() => {
    return token.value?.access_token;
  });

  async function setToken(token: TokenPair | null, isPermanent?: boolean) {
    if (isPermanent === true || isPermanent == undefined) {
      tokenPermanent.value = token;
    }
    if (isPermanent === false || isPermanent == undefined) {
      tokenTemporary.value = token;
    }
    await updateSelfInfo();
  }

  async function logout() {
    if (!token.value) return;
    await setToken(null);
    await router.push("/auth");
  }

  async function refreshToken() {
    if (!token.value) return;
    try {
      const res = await requestApi<TokenPair>(
        "/account/refresh",
        "POST",
        async (e) => {
          if (e.err == "invalid-token") {
            await logout();
            const t = useLocale().getI18n().t;
            new MCSLNotif({
              data: {
                title: t("ui.notification.title.warning"),
                message: t("web.auth.login.expired"),
                color: "warning",
              },
            }).open();
          } else notifyErr(e, "web.auth.login.refresh-error");
        },
        token.value,
      );
      await setToken(res, true);
    } catch {
      /* ignore */
    }
  }

  const selfInfo = ref<UserInfo | null>(null);

  async function updateSelfInfo() {
    if (!accessToken.value) {
      selfInfo.value = null;
      return;
    }
    try {
      selfInfo.value = await requestWithToken<UserInfo>(
        "/user/self",
        "GET",
        async (err) => {
          if (err.err == "invalid-token") await useAccount().refreshToken();
          else notifyErr(err, "web.user-center.user-fetch-error");
        },
      );
    } catch {
      /* ignore */
    }
  }

  setInterval(
    async () => {
      await updateSelfInfo();
    },
    1000 * 60 * 5,
  );

  return {
    accessToken,
    setToken,
    logout,
    refreshToken,
    selfInfo,
    updateSelfInfo,
  };
});
