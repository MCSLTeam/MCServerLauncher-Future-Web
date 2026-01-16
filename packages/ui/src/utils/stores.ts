import { defineStore } from "pinia";
import {
  useLocalStorage,
  useMediaQuery,
  usePreferredColorScheme,
  usePreferredLanguages,
} from "@vueuse/core";
import { computed, ref, watch } from "vue";
import { type Composer, type I18nOptions } from "vue-i18n";

/* ========== [ 主题 ]========== */
export type Theme = "system" | "light" | "dark";
export type ThemeTransition = "viewTransition" | "fade" | "none";

export const useTheme = defineStore("theme", () => {
  const themeStorage = useLocalStorage<Theme>("theme", "system");
  const actualTheme = computed(() => getActualTheme(themeStorage.value));
  let prevClassName = "none";

  function getActualTheme(theme: Theme) {
    if (theme === "system")
      return usePreferredColorScheme().value == "dark" ? "dark" : "light";
    else return theme;
  }

  function getClassName(theme: Theme): string {
    return getActualTheme(theme);
  }

  function change(
    theme: Theme,
    transition: ThemeTransition = "viewTransition",
  ): void {
    themeStorage.value = theme;
    const currClassName = getClassName(theme);
    if (currClassName == prevClassName) return;

    const set = () => {
      document.documentElement.classList.remove(prevClassName);
      document.documentElement.classList.add(currClassName);
      prevClassName = currClassName;
    };

    // 添加过渡样式
    const style = document.createElement("style");
    document.head.appendChild(style);

    switch (transition) {
      case "none":
        // 禁用动画
        style.innerHTML = `
          * {
              transition: none !important;
          }
          `;
        set();
        break;
      case "fade":
        // 渐变动画
        style.innerHTML = `
          * {
              transition: ease-in-out 0.5s !important;
          }
          `;
        set();
        break;
      case "viewTransition":
        // 扩散动画
        if (!document.startViewTransition) {
          // 浏览器不支持 ViewTransition 就使用渐变
          change(theme, "fade");
          return;
        }
        (() => {
          style.innerHTML = `
          * {
              transition: none !important;
          }
          `;

          // 加载过渡动画
          const viewTransition = document.startViewTransition(set);

          // 从鼠标处开始扩散
          const mousePos = useMousePosition();

          const endRadius = Math.hypot(
            Math.max(mousePos.x, innerWidth - mousePos.x),
            Math.max(mousePos.y, innerHeight - mousePos.y),
          );
          viewTransition.ready.then(() => {
            const clipPath = [
              `circle(0px at ${mousePos.x}px ${mousePos.y}px)`,
              `circle(${endRadius}px at ${mousePos.x}px ${mousePos.y}px)`,
            ];
            document.documentElement.animate(
              {
                clipPath:
                  currClassName == "dark" ? clipPath : [...clipPath].reverse(),
              },
              {
                duration: 500,
                easing: "ease-in-out",
                pseudoElement:
                  currClassName == "dark"
                    ? "::view-transition-new(root)"
                    : "::view-transition-old(root)",
              },
            );
          });
        })();
        break;
    }

    // 移除过渡样式
    setTimeout(() => style.remove(), 500);
  }

  function load() {
    change(themeStorage.value, "none");
  }

  // 监听系统主题变更
  watch(usePreferredColorScheme(), () => {
    change(themeStorage.value, "fade");
  });

  return {
    load,
    change,
    actualTheme,
    theme: computed(() => themeStorage.value),
  };
});

/* ========== [ 语言 ]========== */
export const LOCALES = [
  "en-US",
  "ja-JP",
  "ru-RU",
  "zh-CN",
  "zh-TW",
  "zh-HK",
  "zh-MEME",
] as const;

export type I18nMessages = Record<Locale, any>;

export type Locale = (typeof LOCALES)[number] | "system";

const i18nOptions: I18nOptions = {
  legacy: false,
  fallbackLocale: {
    zh: ["zh-CN"],
    "zh-TW": ["zh-HK", "zh-CN"],
    "zh-HK": ["zh-TW", "zh-CN"],
    "zh-MEME": ["zh-CN"],
    "zh-Hans": ["zh-CN"],
    "zh-Hant": ["zh-TW", "zh-HK", "zh-CN"],
    default: ["en-US"],
  },
};

export const useLocale = defineStore("locale", () => {
  const locale = useLocalStorage<Locale>("locale", "system");
  let messagesCache: I18nMessages | undefined = undefined;
  let i18n: Composer | undefined = undefined;

  function injectI18n(composer: Composer) {
    i18n = composer;
  }

  function getI18n() {
    return i18n!;
  }

  async function generateConfig(): Promise<I18nOptions> {
    await importMessages();
    return {
      ...i18nOptions,
      locale: getLocale(locale.value),
      messages: getMessages(),
    };
  }

  async function importMessages() {
    const messages: any = {};
    for (const locale of LOCALES) {
      const message = (await import(`@repo/locales/locales/${locale}.json`))
        .default;
      const eula = (await import(`@repo/locales/eula/${locale}.json`)).default;
      message.shared.eula = {
        ...message.shared.eula,
        ...eula,
      };
      messages[locale] = message;
    }
    messagesCache = messages;
  }

  function getMessages() {
    return messagesCache!;
  }

  function getLocale(locale: Locale) {
    return locale == "system"
      ? ((usePreferredLanguages().value[0] as Locale) ?? "en-US")
      : locale;
  }

  function setLocale(l: Locale) {
    getI18n().locale.value = locale.value = getLocale(l);
  }

  return {
    locale,
    injectI18n,
    getI18n,
    generateConfig,
    getMessages,
    getLocale,
    setLocale,
  };
});

/* ========== [ 屏幕宽度 ]========== */

/**
 * 屏幕宽度类型
 *
 * lg - 大型电脑（屏幕宽度 >= 1024px）
 *
 * md - 笔记本电脑（768px < 屏幕宽度 < 1024px）
 *
 * sm - 平板电脑（450px < 屏幕宽度 <= 768px）
 *
 * xs - 手机（屏幕宽度 <= 450px） 为什么不用425px呢，因为我iPhone 12 Pro Max大于425px就很神奇
 */
export type ScreenWidth = "lg" | "md" | "sm";

export const useScreenWidth = defineStore("screenWidth", () => {
  const isXs = useMediaQuery("(max-width: 450px)");
  const isSm = useMediaQuery("(max-width: 768px)");
  const isMd = useMediaQuery("(max-width: 1024px)");

  const width = computed(() => {
    if (isXs.value) return "xs";
    if (isSm.value) return "sm";
    if (isMd.value) return "md";
    return "lg";
  });

  return {
    width,
    isXsOrSm: computed(() => isXs.value || isSm.value),
  };
});

/* ========== [ 鼠标位置 ]========== */
export const useMousePosition = defineStore("mousePosition", () => {
  const mousePosition = ref({ x: 0, y: 0 });

  function onMouseMove(e: MouseEvent) {
    mousePosition.value.x = e.clientX;
    mousePosition.value.y = e.clientY;
  }

  return {
    onMouseMove,
    x: computed(() => mousePosition.value.x),
    y: computed(() => mousePosition.value.y),
  };
});
