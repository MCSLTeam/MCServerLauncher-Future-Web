export default defineAppConfig({
	appVersion: async () => {
		return (await import('./package.json')).default.version;
	},
	updater: 'https://example.com/update.json',
});

(async () => {
	console.log(
		'MCSL Future Web 版本：' +
			(await import('./package.json')).default.version,
	);
})();
