// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2024-04-03',
	devtools: { enabled: true },
	modules: [
		'@nuxtjs/i18n',
		'@nuxtjs/eslint-module',
		'@pinia/nuxt',
		'@element-plus/nuxt',
		'@nuxt/eslint',
		'@vueuse/nuxt',
	],
	app: {
		head: {
			noscript: [
				{
					innerHTML:
						'<div class="noscript"><p>MCSL Future Web 的部分功能需要启用 JavaScript 才可使用！</p></div>',
				},
			],
			link: [
				{
					rel: 'icon',
					type: 'image/png',
					href: '/assets/img/favicon.png',
				},
			],
		},
		pageTransition: {
			name: 'page',
			mode: 'out-in',
		},
	},
	nitro: {
		storage: {
			db: {
				driver: 'fs',
				base: './mcsl-web',
			},
		},
	},
	ssr: false,
});
