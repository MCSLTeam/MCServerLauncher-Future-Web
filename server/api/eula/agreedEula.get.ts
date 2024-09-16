export default defineEventHandler(async () => {
	return {
		status: 'ok',
		data: {
			agreedEula: (await getConfig()).agreedEula,
		},
		message: '',
	};
});
