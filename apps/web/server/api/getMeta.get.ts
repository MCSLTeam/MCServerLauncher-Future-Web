export default defineEventHandler(async () => {
	return {
		status: 'ok',
		data: {
			beian: (await getConfig()).beian,
			siteName: (await getConfig()).siteName,
		},
		message: '',
	};
});
