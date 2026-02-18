import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useLocalStorage, useSessionStorage } from "@vueuse/core";
import { notifyErr, requestWithToken } from "./network.ts";
import router from "@repo/shared/src/router.ts";

export type UserInfo = {
  name: string;
  permissions: string[];
};

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

  async function logout() {
    if (!token.value) return;
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
        "/user/self",
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
    selfInfo,
    updateSelfInfo,
  };
});
