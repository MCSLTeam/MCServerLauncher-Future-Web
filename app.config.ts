const config = {
	appVersion: async () => {
		return (await import('./package.json')).default.version;
	},
	updater: 'https://example.com/update.json',
	locales: ['en-US', 'zh-CN', 'zh-MEME'],
};

(async () => {
	console.log('MCSL Future Web version: ' + (await config.appVersion()));
})();

export default defineAppConfig(config);
