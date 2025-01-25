import { formatError } from "~/utils/common.ts";
import { useLocale } from "@repo/commons/src/utils/uses";

export const useAccount = defineStore("account", () => {
  const tokenPermanent = useLocalStorage<string | null>("token", null);
  const tokenTemporary = useSessionStorage<string | null>("token", null);
  let timeout: any;
  let adminRegisteredStorage: boolean | undefined = undefined;

  const tokenInfo = ref({
    expire: "",
    username: "",
  });

  async function adminRegistered() {
    if (adminRegisteredStorage == undefined) {
      await refreshAdminRegistered();
    }
    return adminRegisteredStorage!;
  }

  async function refreshAdminRegistered() {
    adminRegisteredStorage = (<any>await $fetch("/api/auth/hasAdmin")).data.has;
  }

  const token = computed(() => {
    return tokenPermanent.value ?? tokenTemporary.value;
  });

  const loggedIn = computed(() => {
    return token.value != null;
  });

  async function init() {
    await refreshAdminRegistered();
    await scheduleRefresh();
  }

  function requireLogin(loggedIn: boolean) {
    if (loggedIn != loggedIn) {
      throw new Error(`用户${loggedIn ? "已" : "未"}登录`);
    }
  }

  function setToken(token: string | null, isPermanent?: boolean) {
    if (isPermanent == true || isPermanent == undefined) {
      tokenPermanent.value = token;
    }
    if (isPermanent == false || isPermanent == undefined) {
      tokenTemporary.value = token;
    }
  }

  async function registerAdmin(username: string, password: string) {
    requireLogin(false);
    const res = await $fetch("/api/auth/registerAdmin", {
      method: "POST",
      body: {
        username: username,
        password: password,
      },
    });
    if (res.status == "ok") {
      await init();
    } else {
      throw res.message;
    }
  }

  async function login(
    username: string | null,
    password: string,
    remember: boolean,
  ) {
    requireLogin(false);
    const res: any = await $fetch("/api/auth/login", {
      method: "POST",
      body: {
        username: username,
        password: password,
        rememberMe: remember,
      },
    });
    if (res.status == "ok") {
      setToken(res.data.token, remember);
      await init();
    } else {
      await logout();
      throw res.message;
    }
  }

  async function logout() {
    setToken(null);
    await scheduleRefresh();
    await useRouter().push("/");
  }

  async function refreshTokenInfo() {
    const res: any = await $fetch("/api/auth/getTokenInfo", {
      method: "POST",
      body: {
        token: token.value,
      },
    });
    if (res.status == "ok") {
      tokenInfo.value = res.data;
    } else {
      throw res.message;
    }
  }

  async function scheduleRefresh() {
    if (timeout) clearTimeout(timeout);
    if (loggedIn.value) {
      try {
        await refreshTokenInfo();
        const delay =
          new Date(tokenInfo.value.expire).getTime() - Date.now() - 60000;
        if (delay > 2147483647) {
          timeout = setTimeout(async () => {
            await scheduleRefresh();
          }, 2147483647);
        } else {
          timeout = setTimeout(async () => {
            await logout();
            ElMessage.warning(
              useLocale().getI18n().t("auth.login.failed.expired"),
            );
          }, delay);
        }
      } catch (e: any) {
        ElMessage.error(formatError("auth.login.failed.verify", e));
        await logout();
      }
    }
  }

  return {
    init,
    token,
    loggedIn,
    adminRegistered,
    tokenInfo,
    registerAdmin,
    login,
    logout,
  };
});
