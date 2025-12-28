import { defineStore } from "pinia";
import { computed } from "vue";
import { useLocalStorage, useSessionStorage } from "@vueuse/core";
import router from "@repo/shared/src/router.ts";

export const useAccount = defineStore("account", () => {
  const tokenPermanent = useLocalStorage<string | null>("mcsl-web-token", null);
  const tokenTemporary = useSessionStorage<string | null>(
    "mcsl-web-token",
    null,
  );

  const token = computed(() => {
    return tokenPermanent.value ?? tokenTemporary.value;
  });

  const loggedIn = computed(() => {
    return token.value != null;
  });

  function setToken(token: string | null, isPermanent?: boolean) {
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

  return {
    token,
    setToken,
    logout,
    loggedIn,
  };
});
