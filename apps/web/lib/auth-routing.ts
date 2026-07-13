import { fetchShouldRegister } from "@/features/auth/auth-provider";
import { isFirstLoad } from "@/lib/first-load";

/**
 * 未登录用户目标路由：
 * firstLoad → welcome/setup
 * shouldRegister → register（仅空库首个管理员）
 * 否则 → login
 */
export async function resolveUnauthedDestination(): Promise<string> {
  if (typeof window !== "undefined" && isFirstLoad()) {
    return "/welcome/setup/";
  }
  const should = await fetchShouldRegister();
  return should ? "/register/" : "/login/";
}
