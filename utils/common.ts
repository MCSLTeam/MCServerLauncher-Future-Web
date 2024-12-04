/**
 * 推迟执行
 * @param ms - 推迟时长（毫秒）
 * @example
 * await sleep(1000); // 1秒后执行
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 生成随机数
 * @param min - 最小值（一个参数时作为最大值）
 * @param max - 最大值
 * @example
 * // 获取 min - max 之间的随机整数（含最小值，不含最大值）
 * randNum(10, 101); // 随机获取10-100的随机数
 * @example
 * // 获取 0 - max 之间的随机整数（含0，不含最大值）
 * randNum(11); // 随机获取0-10的随机数
 * @example
 * // 获取 0 - 1 之间的随机浮点数
 * randNum(); // 相当于Math.random()
 */
export function randNum(min?: number, max?: number) {
	if (min != undefined && max != undefined)
		return Math.floor(Math.random() * (max - min)) + min; // 含最小值，不含最大值
	else if (min != undefined) return randNum(0, min);
	else return Math.random();
}

/**
 * 防抖节流
 * @param func - 回调函数
 * @param delay - 延迟时间（毫秒）
 * @returns 返回一个函数，调用该函数时会在延迟时间后执行回调函数。如果在延迟时间内再次调用该函数时，会重新计算延迟时间
 * @example
 * // 在用户滚动完成（连续500毫秒不滚动）后输出'滚动'
 * function onScroll() {
 *     console.log('滚动');
 * }
 * const onScrollDebounce = debounce(onScroll, 500);
 * window.addEventListener('scroll', onScrollDebounce);
 */
export function debounce(func: () => any, delay: number) {
	let timer: NodeJS.Timeout | null = null;
	return function() {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			func();
		}, delay);
	};
}

/**
 * 打开链接，新窗口
 * @param url - 链接
 */
export function openUrl(url: string) {
	window.open(url, '_blank');
}

/**
 * 判断是否为愚人节
 * @returns 是否为愚人节
 */
export function isAprilFoolsDay() {
	const now = new Date();
	return now.getMonth() == 3 && now.getDate() == 1;
}

/**
 * 获取logo图片路径，方便愚人节更换特殊logo
 * @returns logo图片路径
 */
export function getLogoSrc() {
	return isAprilFoolsDay()
		? '/assets/img/MCSLFutureAprilFools.png'
		: '/assets/img/MCSLFuture.png';
}

/**
 * 获取i18n语言及内容
 * @returns 语言及内容
 */
export async function getI18nMessages() {
	const messages: any = {};
	for (const locale of useAppConfig().locales) {
		messages[locale] = (
			await import(`../assets/i18n/${locale}.json`)
		).default;
	}
	return messages;
}
