import { defineStore } from "pinia";
import { computed } from "vue";
import { useLocalStorage, useSessionStorage } from "@vueuse/core";
import router from "@repo/shared/src/router.ts";
import { requestApi } from "./network.ts";

export type TokenPair = { access_token: string; refresh_token: string };

export const useAccount = defineStore("account", () => {
  const tokenPermanent = useLocalStorage<TokenPair | null>(
    "mcsl-web-token",
    null,
  );
  const tokenTemporary = useSessionStorage<TokenPair | null>(
    "mcsl-web-token",
    null,
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
