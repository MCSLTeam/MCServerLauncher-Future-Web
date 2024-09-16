export default defineI18nConfig(async () => ({
	legacy: false,
	locale: getLocaleValue(),
	fallbackLocale: {
		zh: ['zh-CN'],
		'zh-TW': ['zh-CN'],
		'zh-HK': ['zh-TW', 'zh-CN'],
		'zh-MEME': ['zh-CN'],
		'zh-Hans': ['zh-CN'],
		'zh-Hant': ['zh-TW', 'zh-CN'],
		default: ['en-US', 'zh-CN'],
	},
	messages: await getMessages(),
}));

async function getMessages() {
	const messages: any = {};
	for (const locale of useAppConfig().locales) {
		messages[locale] = (
			await import(`./assets/i18n/${locale}.json`)
		).default;
	}
	return messages;
}

/**
 * 获取当前语言
 * @returns 当前语言
 */
function getLocaleValue() {
	let locale = useLocalStorage('locale', 'auto').value;
	if (locale == 'auto') locale = usePreferredLanguages().value[0];
	return locale;
}
