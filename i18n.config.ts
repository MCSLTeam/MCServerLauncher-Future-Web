export default defineI18nConfig(async () => ({
	legacy: false,
	locale: getLocaleValue(),
	fallbackLocale: 'zh-CN',
	messages: {
		'en-US': (await import('./assets/i18n/en-US.json')).default,
		'zh-CN': (await import('./assets/i18n/zh-CN.json')).default,
	},
}));

function getLocaleValue() {
	let locale = useLocalStorage(
		'locale',
		usePreferredLanguages().value[0],
	).value;
	if (locale == 'auto') locale = usePreferredLanguages().value[0];
	return locale;
}
