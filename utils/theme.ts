import { isClientRender } from '~/utils/common';

const isDark = useDark({
	storageKey: 'darkMode',
});

export function changeTheme(
	event?: MouseEvent,
	transition: boolean = true,
	change: boolean = true,
) {
	if (isClientRender()) {
		const darken = change ? !isDark.value : isDark.value;
		const document = window.document as Document & {
			startViewTransition: any;
		};

		function toggleDark() {
			if (change) {
				useToggle(isDark)();
			}
			if (darken) {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}

		// 添加过渡样式
		const style = document.createElement('style');
		document.head.appendChild(style);

		if (!transition || !isClientRender()) {
			toggleDark();
		} else if (!document.startViewTransition) {
			// 判断浏览器不支持该特性
			style.innerHTML = `
		* {
			transition: ease-in-out 0.5s !important;
		}
		`;
			toggleDark();
		} else {
			style.innerHTML = `
		* {
			transition: none !important;
		}
		`;
			// 开始加载 ViewTransition 扩散动画
			const viewTransition = document.startViewTransition(() => {
				toggleDark();
			});

			// 从点击处(否则右上角)开始扩散
			const x = event?.clientX ?? window.innerWidth;
			const y = event?.clientY ?? 0;

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
		}
		setTimeout(() => style.remove(), 500);
	}
}
