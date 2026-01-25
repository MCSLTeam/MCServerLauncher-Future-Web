import { defineStore } from "pinia";
import {
  useLocalStorage,
  useMediaQuery,
  usePreferredColorScheme,
  usePreferredLanguages,
} from "@vueuse/core";
import { computed, ref, watch } from "vue";
import { type Composer, type I18nOptions } from "vue-i18n";

/* ========== [ 外观 ]========== */
export type Theme = "system" | "light" | "dark";
export type ThemeTransition = "viewTransition" | "fade" | "none";
export type Rendering = "advanced" | "basic" | "fast";

export const useAppearance = defineStore("appearance", () => {
  const themeStorage = useLocalStorage<Theme>("theme", "system");
  const renderingStorage = useLocalStorage<Rendering>(
    "rendering",
    useMediaQuery("(prefers-reduced-motion: reduce)").value
      ? "basic"
      : "advanced",
  );
  const actualTheme = computed(() => getActualTheme(themeStorage.value));

  function getActualTheme(theme: Theme) {
    if (theme === "system")
      return usePreferredColorScheme().value == "dark" ? "dark" : "light";
    else return theme;
  }

  let prevActualTheme = "none";
  function changeTheme(theme: Theme, transition?: ThemeTransition): void {
    themeStorage.value = theme;
    const currActualTheme = getActualTheme(theme);
    if (currActualTheme == prevActualTheme) return;

    const set = () => {
      document.documentElement.classList.remove(prevActualTheme);
      document.documentElement.classList.add(currActualTheme);
      prevActualTheme = currActualTheme;
    };

    // 添加过渡样式
    const style = document.createElement("style");
    document.head.appendChild(style);

    if (!transition)
      switch (renderingStorage.value) {
        case "advanced":
          transition = "viewTransition";
          break;
        case "basic":
          transition = "fade";
          break;
        case "fast":
          transition = "none";
          break;
      }

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
          changeTheme(theme, "fade");
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
                  currActualTheme == "dark"
                    ? clipPath
                    : [...clipPath].reverse(),
              },
              {
                duration: 500,
                easing: "ease-in-out",
                pseudoElement:
                  currActualTheme == "dark"
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
    changeTheme(themeStorage.value, "none");
    setRendering(renderingStorage.value);
  }

  // 监听系统主题变更
  watch(usePreferredColorScheme(), () => {
    changeTheme(themeStorage.value, "fade");
  });

  let prevRendering = "none";
  function setRendering(rendering: Rendering) {
    renderingStorage.value = rendering;
    if (rendering == prevRendering) return;
    document.documentElement.classList.remove(`rendering-${prevRendering}`);
    document.documentElement.classList.add(`rendering-${rendering}`);
    prevRendering = rendering;
  }

  return {
    load,
    changeTheme,
    setRendering,
    actualTheme,
    rendering: computed(() => renderingStorage.value),
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
    locale.value = l;
    getI18n().locale.value = getLocale(l);
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
