/**
 * 翻译错误信息
 * @param key - 错误消息本地化键名
 * @param message - 错误信息
 * @returns 错误消息
 */
export function formatError(key: string, message: string) {
  const i18n = useNuxtApp().$i18n;
  const reasonKey = "request.failed.reason." + message;
  const reason = i18n.t(reasonKey);
  return i18n.t(key, { reason: reason == reasonKey ? message : reason });
}
