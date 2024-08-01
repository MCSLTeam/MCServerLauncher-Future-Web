export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randNum(min?: number, max?: number) {
	if (min && !max) return randNum(0, min);
	else if (min && max)
		return Math.floor(Math.random() * (max - min)) + min; // 含最小值，不含最大值
	else return Math.random();
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

export function openUrl(url: string) {
	window.open(url, '_blank');
}

export function isAprilFoolsDay() {
	const now = new Date();
	return now.getMonth() == 3 && now.getDate() == 1;
}

export function getLogoSrc() {
	return isAprilFoolsDay()
		? '/assets/img/MCSLFutureAprilFools.png'
		: '/assets/img/MCSLFuture.png';
}
