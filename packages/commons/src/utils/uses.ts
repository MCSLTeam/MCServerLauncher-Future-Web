import {defineStore} from "pinia";
import {computed, type Ref, ref} from "vue";
import {useLocalStorage, usePreferredColorScheme, usePreferredLanguages,} from "@vueuse/core";
import {debounce} from "./common";
import {merge} from "lodash";
import {type Composer} from "vue-i18n";

/* ========== [ 主题 ]========== */

/**
 * 主题类型
 *
 * auto - 跟随系统
 *
 * dark - 深色模式
 *
 * light - 浅色模式
 */
export type DarkMode = "auto" | "dark" | "light";
/**
 * 主题过渡类型
 *
 * viewTransition - 扩散过渡
 *
 * fade - 渐变过渡
 *
 * none - 无过渡
 */
export type DarkModeTransition = "viewTransition" | "fade" | "none";

interface MyDocument extends Document {
    // 防止类型检测报错
    startViewTransition: any;
}

export const useDarkMode = defineStore("theme", () => {
    const mode = useLocalStorage("darkMode", "auto");

    /**
     * 加载主题
     */
    function loadTheme() {
        changeTheme(<DarkMode>mode.value, undefined, "none", true);
    }

    /**
     * 判断主题类型在当前是否是深色模式
     * @param darkMode - 主题类型
     * @returns 是否是深色模式
     */
    function isDark(darkMode: DarkMode): boolean {
        switch (darkMode) {
            case "auto":
                return usePreferredColorScheme().value == "dark";
            case "dark":
                return true;
            case "light":
                return false;
        }
    }

    /**
     * 切换主题
     * @param darkMode - 主题类型
     * @param event - 点击事件
     * @param transition - 过渡类型
     * @param force - 是否强制切换（如果没有区别不切换，默认false）
     */
    function changeTheme(
        darkMode: DarkMode,
        event?: MouseEvent,
        transition: DarkModeTransition = "viewTransition",
        force: boolean = false,
    ): void {
        const darken = isDark(darkMode);
        if (!force && darken == isDark(<DarkMode>mode.value)) return;

        const toggleDark = () => {
            mode.value = darkMode;
            if (darken) {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
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
                toggleDark();
                break;
            case "fade":
                // 渐变动画
                style.innerHTML = `
                * {
                    transition: ease-in-out 0.5s !important;
                }
                `;
                toggleDark();
                break;
            case "viewTransition":
                // 扩散动画a
                (() => {
                    if (!(<MyDocument>document).startViewTransition) {
                        // 浏览器不支持ViewTransition就使用渐变
                        changeTheme(darkMode, event, "fade", force);
                        return;
                    }

                    style.innerHTML = `
                        * {
                            transition: none !important;
                        }
                        `;

                    // 加载过渡动画
                    const viewTransition = (<MyDocument>document).startViewTransition(
                        () => {
                            toggleDark();
                        },
                    );

                    // 从点击处(为null就屏幕中心)开始扩散
                    const x = event?.clientX ?? window.innerWidth / 2;
                    const y = event?.clientY ?? window.innerHeight / 2;

                    const endRadius = Math.hypot(
                        Math.max(x, innerWidth - x),
                        Math.max(y, innerHeight - y),
                    );
                    viewTransition.ready.then(() => {
                        const clipPath = [
                            `circle(0px at ${x}px ${y}px)`,
                            `circle(${endRadius}px at ${x}px ${y}px)`,
                        ];
                        document.documentElement.animate(
                            {
                                clipPath: darken ? clipPath : [...clipPath].reverse(),
                            },
                            {
                                duration: 500,
                                easing: "ease-in-out",
                                pseudoElement: darken
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

    // 监听系统主题变更
    window
        .matchMedia("(prefers-color-scheme:dark)")
        .addEventListener("change", () => {
            if (mode.value == "auto") {
                changeTheme(mode.value, undefined, "fade");
            }
        });

    return {
        mode,
        changeTheme,
        loadTheme,
    };
});

/* ========== [ 屏幕宽度 ]========== */

/**
 * 屏幕宽度类型
 *
 * lg - 大屏（屏幕宽度 >= 1024px）
 *
 * md - 中等屏（768px <= 屏幕宽度 < 1024px）
 *
 * sm - 小屏（屏幕宽度 < 768px）
 */
export type ScreenWidth = "lg" | "md" | "sm";

export const useScreenWidth = defineStore("screenWidth", () => {
    const width: Ref<ScreenWidth> = ref("sm");

    const isMdOrBigger = computed(() => width.value != "sm");
    const isMdOrSmaller = computed(() => width.value != "lg");

    /**
     * 检测（刷新）屏幕宽度
     */
    function detectScreenWidth() {
        const screenWidth = window.innerWidth;
        if (screenWidth >= 1024) {
            width.value = "lg";
        } else if (screenWidth >= 768) {
            width.value = "md";
        } else {
            width.value = "sm";
        }
    }

    // 监听屏幕宽度变化
    detectScreenWidth();
    window.addEventListener("resize", debounce(detectScreenWidth, 100));

    return {
        width,
        isMdOrBigger,
        isMdOrSmaller,
    };
});

/* ========== [ 语言 ]========== */
export const useLocale = defineStore("locale", () => {
    const locales = ["en-US", "zh-CN", "zh-MEME"];
    const localeStorage = useLocalStorage("locale", "auto");
    let messagesCache = {};
    let i18n: Composer | undefined = undefined;

    function injectI18n(c: Composer) {
        i18n = c;
    }

    function getI18n() {
        return i18n!;
    }

    async function getConfig(messages: any = {}) {
        const commonMessages: any = {};
        for (const locale of locales) {
            commonMessages[locale] = (
                await import(`../assets/i18n/${locale}.json`)
            ).default;
        }
        messagesCache = merge({}, commonMessages, messages);
        return {
            legacy: false,
            locale: getLocaleValue(),
            fallbackLocale: {
                zh: ["zh-CN"],
                "zh-TW": ["zh-CN"],
                "zh-HK": ["zh-TW", "zh-CN"],
                "zh-MEME": ["zh-CN"],
                "zh-Hans": ["zh-CN"],
                "zh-Hant": ["zh-TW", "zh-CN"],
                default: ["en-US", "zh-CN"],
            },
            messages: messagesCache,
        };
    }

    function getMessages(): any {
        return messagesCache!;
    }

    /**
     * 获取当前语言
     * @returns 当前语言
     */
    function getLocaleValue() {
        return getLocale(localeStorage.value);
    }

    function getLocale(locale: string) {
        return locale == "auto"
            ? (usePreferredLanguages().value[0] ?? "en-US")
            : locale;
    }

    function setLocale(locale: string) {
        localeStorage.value = getLocale(locale);
        getI18n().locale.value = getLocale(locale);
    }

    return {
        locales,
        localeStorage,
        injectI18n,
        getI18n,
        getConfig,
        getMessages,
        getLocaleValue,
        getLocale,
        setLocale,
    };
});

