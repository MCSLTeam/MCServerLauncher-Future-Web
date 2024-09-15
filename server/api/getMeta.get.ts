export default defineEventHandler(async () => {
	return {
		status: 'ok',
		data: {
			beian: (await getConfig()).beian,
			siteTitle: (await getConfig()).siteTitle,
		},
		message: '',
	};
});
