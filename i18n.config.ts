export default defineI18nConfig(async () => ({
	legacy: false,
	locale: 'zh-CN',
	messages: {
		'en-US': (await import('./assets/i18n/en-US.json')).default,
		'zh-CN': (await import('./assets/i18n/zh-CN.json')).default,
	},
}));
