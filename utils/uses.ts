/* 主题 */
const darkModeStorage = useSessionStorage('darkMode', 'auto');
/**
 * 主题类型
 *
 * auto - 跟随系统
 *
 * dark - 深色模式
 *
 * light - 浅色模式
 */
export type DarkMode = 'auto' | 'dark' | 'light';
/**
 * 主题过渡类型
 *
 * viewTransition - 扩散过渡
 *
 * fade - 渐变过渡
 *
 * none - 无过渡
 */
export type DarkModeTransition = 'viewTransition' | 'fade' | 'none';

/**
 * 获取主题信息
 */
export function useDarkMode() {
	return {
		value: isDark(<DarkMode>darkModeStorage.value),
		loadTheme: () =>
			changeTheme(
				<DarkMode>darkModeStorage.value,
				undefined,
				'none',
				true,
			),
		isDark: isDark,
		changeTheme: changeTheme,
	};
}

/**
 * 判断主题类型在当前是否是深色模式
 * @param darkMode - 主题类型
 * @returns 是否是深色模式
 */
function isDark(darkMode: DarkMode): boolean {
	switch (darkMode) {
		case 'auto':
			return window.matchMedia('(prefers-color-scheme:dark)').matches;
		case 'dark':
			return true;
		case 'light':
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
	transition: DarkModeTransition = 'viewTransition',
	force: boolean = false,
): void {
	const darken = isDark(darkMode);
	if (!force && darken == isDark(<DarkMode>darkModeStorage.value)) return;

	function toggleDark() {
		darkModeStorage.value = darkMode;
		if (darken) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	// 添加过渡样式
	const style = document.createElement('style');
	document.head.appendChild(style);

	switch (transition) {
		case 'none':
			// 禁用动画
			style.innerHTML = `
                * {
                    transition: none !important;
                }
                `;
			toggleDark();
			break;
		case 'fade':
			// 渐变动画
			style.innerHTML = `
                * {
                    transition: ease-in-out 0.5s !important;
                }
                `;
			toggleDark();
			break;
		case 'viewTransition':
			// 扩散动画
			(() => {
				if (!document.startViewTransition) {
					// 浏览器不支持ViewTransition就使用渐变
					changeTheme(darkMode, event, 'fade', force);
					return;
				}

				style.innerHTML = `
                * {
                    transition: none !important;
                }
                `;

				// 加载过渡动画
				const viewTransition = document.startViewTransition(() => {
					toggleDark();
				});

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
							clipPath: darken
								? clipPath
								: [...clipPath].reverse(),
						},
						{
							duration: 500,
							easing: 'ease-in-out',
							pseudoElement: darken
								? '::view-transition-new(root)'
								: '::view-transition-old(root)',
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
	.matchMedia('(prefers-color-scheme:dark)')
	.addEventListener('change', () => {
		if (darkModeStorage.value == 'auto') {
			changeTheme(darkModeStorage.value, undefined, 'fade');
		}
	});

/* 屏幕宽度 */
const screenWidthRef: Ref<ScreenWidth> = ref('sm');

/**
 * 获取屏幕宽度信息
 */
export function useScreenWidth() {
	return {
		value: screenWidthRef.value,
		isMdOrBigger: () => screenWidthRef.value != 'sm',
		isMdOrSmaller: () => screenWidthRef.value != 'lg',
	};
}

/**
 * 屏幕宽度类型
 *
 * lg - 大屏（屏幕宽度 >= 1024px）
 *
 * md - 中等屏（768px <= 屏幕宽度 < 1024px）
 *
 * sm - 小屏（屏幕宽度 < 768px）
 */
export type ScreenWidth = 'lg' | 'md' | 'sm';
function detectScreenWidth() {
	const screenWidth = window.innerWidth;
	if (screenWidth >= 1024) {
		screenWidthRef.value = 'lg';
	} else if (screenWidth >= 768) {
		screenWidthRef.value = 'md';
	} else {
		screenWidthRef.value = 'sm';
	}
}

// 监听屏幕宽度变化
detectScreenWidth();
window.addEventListener('resize', debounce(detectScreenWidth, 250));

/* 语言 */
const localeStorage = useLocalStorage(
	'locale',
	usePreferredLanguages().value[0],
);

/**
 * 获取语言信息
 */
export function useLocale() {
	return {
		value: localeStorage.value,
		availableLocales: computed(() => {
			return useNuxtApp().$i18n.locales.value;
		}),
		setLocale(locale: string) {
			localeStorage.value = locale;
			useNuxtApp().$i18n.setLocale(getLocale(locale));
		},
	};
}

/**
 * 获取系统语言
 * @param locale - 语言
 * @returns 语言
 */
function getLocale(locale: string) {
	if (locale == 'auto') locale = usePreferredLanguages().value[0];
	return locale;
}
