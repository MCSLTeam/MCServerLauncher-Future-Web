import { defineStore } from "pinia";
import { computed } from "vue";
import {
  type Serializer,
  useLocalStorage,
  useSessionStorage,
} from "@vueuse/core";
import router from "@repo/shared/src/router.ts";
import { requestApi } from "./network.ts";
import { MCSLNotif } from "@repo/ui/src/utils/notifications.ts";
import { useLocale } from "@repo/ui/src/utils/stores.ts";

export type TokenPair = { access_token: string; refresh_token: string };

const jsonSerializer: Serializer<TokenPair | null> = {
  write: (token: TokenPair | null) =>
    token == null ? "" : JSON.stringify(token),
  read: (token: string) =>
    token == "" ? null : (JSON.parse(token) as TokenPair),
};

export const useAccount = defineStore("account", () => {
  const tokenPermanent = useLocalStorage<TokenPair | null>(
    "mcsl-web-token",
    null,
    { serializer: jsonSerializer },
  );
  const tokenTemporary = useSessionStorage<TokenPair | null>(
    "mcsl-web-token",
    null,
    { serializer: jsonSerializer },
  );

  const token = computed(() => {
    return tokenPermanent.value ?? tokenTemporary.value;
  });

  const accessToken = computed(() => {
    return token.value?.access_token;
  });

  function setToken(token: TokenPair | null, isPermanent?: boolean) {
    if (isPermanent === true || isPermanent == undefined) {
      tokenPermanent.value = token;
    }
    if (isPermanent === false || isPermanent == undefined) {
      tokenTemporary.value = token;
    }
  }

  async function logout() {
    setToken(null);
    await router.push("/");
  }

  async function refreshToken(): Promise<boolean> {
    // 只有永久 Token 存在时才刷新
    if (!tokenPermanent.value) return false;
    try {
      const res = await requestApi<TokenPair>(
        "/api/account/refresh",
        "POST",
        token.value,
      );
      setToken(res, true);
      return true;
    } catch {
      const t = useLocale().getI18n().t;
      new MCSLNotif({
        data: {
          title: t("ui.notification.title.warning"),
          message: t("web.login.expired"),
          color: "warning",
        },
      }).open();
      await logout();
      return false;
    }
  }

  return {
    accessToken,
    setToken,
    logout,
    refreshToken,
  };
});
