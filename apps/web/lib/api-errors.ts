const ERROR_MESSAGES: Record<string, string> = {
  "login-failed": "用户名或密码不正确。",
  "admin-exists": "已存在管理员账户，请直接登录。",
  "username-exists": "该用户名已被使用。",
  "user-not-found": "找不到该用户。",
  "invalid-token": "登录已失效，请重新登录。",
  "permission-denied": "没有权限执行此操作。",
  "internal-server-error": "服务器繁忙，请稍后重试。",
  "network-error": "无法连接服务器，请检查网络或确认面板服务已启动。",
  "invalid-password": "密码不符合要求。",
  "wrong-password": "原密码不正确。",
};

export function formatApiError(code?: string, fallback?: string): string {
  if (!code) return fallback ?? "操作失败，请稍后重试。";
  return ERROR_MESSAGES[code] ?? fallback ?? `操作失败（${code}）`;
}
