import {
  THEME_COOKIE_KEY,
  THEME_STORAGE_KEY,
} from "@/features/theme/theme-keys";

/**
 * 首屏绘制前同步主题 class，避免 system/dark 下闪白。
 * 放在 <head> 中。
 */
const initScript = `
(function () {
  try {
    var root = document.documentElement;
    var cookieKey = "${THEME_COOKIE_KEY}";
    var storageKey = "${THEME_STORAGE_KEY}";
    var match = document.cookie.match(new RegExp("(?:^|; )" + cookieKey + "=([^;]*)"));
    var cookieVal = match && match[1];
    var storedTheme = null;
    try {
      storedTheme = localStorage.getItem(storageKey) || cookieVal;
      if (!storedTheme) {
        var raw = localStorage.getItem("mcsl-web-settings");
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && (parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "system")) {
            storedTheme = parsed.theme;
          }
        }
      }
    } catch (e) {
      storedTheme = cookieVal;
    }
    var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var mode = storedTheme === "light" || storedTheme === "dark" || storedTheme === "system" ? storedTheme : "system";
    var useDark = mode === "dark" || (mode === "system" && systemDark);
    root.classList.toggle("dark", useDark);
    root.classList.toggle("light", mode === "light");
    root.style.colorScheme = useDark ? "dark" : "light";
  } catch (error) {}
})();`;

export function InitialPreferencesScript({
  appKey = "mcsl-web",
}: {
  appKey?: string;
}) {
  return (
    <script
      id={`${appKey}-initial-preferences`}
      dangerouslySetInnerHTML={{ __html: initScript }}
    />
  );
}
