export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// 防抖
export function debounce(func: () => any, delay: number) {
	let timer: NodeJS.Timeout | null = null;
	return function () {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			func();
		}, delay);
	};
}
