export default defineEventHandler(async () => {
	const config = await getConfig();
	config.agreedEula = true;
	await saveConfig(config);
	return {
		status: 'ok',
		data: {},
		message: '',
	};
});
