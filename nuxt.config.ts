// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2024-04-03',
	devtools: {
		enabled: true,
		timeline: {
			enabled: true,
		},
	},
	ssr: false,
	modules: [
		'@nuxtjs/i18n',
		'@nuxtjs/eslint-module',
		'@element-plus/nuxt',
		'@nuxt/eslint',
		'@vueuse/nuxt',
	],
	app: {
		head: {
			noscript: [
				{
					// 没有JavaScript时显示
					innerHTML:
						'<div class="noscript"><p>MCSL Future Web 的部分功能需要启用 JavaScript 才可使用！</p></div>',
				},
			],
		},
		pageTransition: {
			name: 'blur',
			mode: 'out-in',
		},
		layoutTransition: {
			name: 'fade',
			mode: 'out-in',
		},
	},
});
