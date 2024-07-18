export default defineI18nConfig(async () => ({
	legacy: false,
	locale: usePreferredLanguages().value[0],
	fallbackLocale: 'zh-CN',
	messages: {
		'en-US': (await import('./assets/i18n/en-US.json')).default,
		'zh-CN': (await import('./assets/i18n/zh-CN.json')).default,
	},
}));
