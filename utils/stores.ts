/* 浅色/深色模式 */
const darkModeStorage: Ref<DarkMode> = useSessionStorage('darkMode', 'auto');
export type DarkMode = 'auto' | 'dark' | 'light';
export type DarkModeTransition = 'viewTransition' | 'fade' | 'none';

export function useDarkMode() {
	return {
		value: isDark(darkModeStorage.value),
		loadTheme: () =>
			changeTheme(darkModeStorage.value, undefined, 'none', true),
		isDark: isDark,
		changeTheme: changeTheme,
	};
}

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

function changeTheme(
	darkMode: DarkMode,
	event?: MouseEvent,
	transition: DarkModeTransition = 'viewTransition',
	force: boolean = false,
): void {
	const darken = isDark(darkMode);
	if (!force && darken == isDark(darkModeStorage.value)) return;

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
					// 浏览器不支持ViewTransition
					changeTheme(darkMode, event, 'none', force);
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

				// 从点击处(否则屏幕中心)开始扩散
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
							easing: 'ease-in-out',
							pseudoElement: darken
								? '::view-transition-new(root)'
								: '::view-transition-old(root)',
						},
					);
				});
				break;
			})();
	}
	setTimeout(() => style.remove(), 500);
}

// 监听系统主题变更
window
	.matchMedia('(prefers-color-scheme:dark)')
	.addEventListener('change', () => {
		if (darkModeStorage.value == 'auto') {
			changeTheme(darkModeStorage.value, undefined, 'fade', true);
		}
	});
