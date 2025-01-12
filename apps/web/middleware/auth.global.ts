import { agreedEula } from "@repo/commons/src/utils/loader";

/**
 * 登录验证中间件，检测是否需要登录/注册/同意EULA，需要就跳转
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (!agreedEula.value) {
    // 未同意EULA
    if (!to.fullPath.startsWith("/welcome"))
      return navigateTo("/welcome/welcome");
    return;
  } else {
    if (to.fullPath.startsWith("/welcome")) return abortNavigation();
  }

  if (await shouldRegister()) {
    // 未注册
    if (to.fullPath != "/auth/register") return navigateTo("/auth/register");
    return;
  } else {
    if (to.fullPath == "/auth/register") return abortNavigation();
  }

  if (await shouldLogin()) {
    // 未登录
    if (to.fullPath != "/auth/login") return navigateTo("/auth/login");
    return;
  } else {
    if (to.fullPath == "/auth/login") return abortNavigation();
  }
});
