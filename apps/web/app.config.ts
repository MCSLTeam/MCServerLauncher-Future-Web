const config = {
	appVersion: async () => {
		return (await import('./package.json')).default.version;
	},
	updater: 'https://example.com/update.json',
	resourcepackFormat: 1,
};

(async () => {
	console.log('MCSL Future Web version: ' + (await config.appVersion()));
})();

export default defineAppConfig(config);
