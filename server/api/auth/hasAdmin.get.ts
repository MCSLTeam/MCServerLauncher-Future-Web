export default defineEventHandler(async () => {
	try {
		await requireEula();
		return {
			status: 'ok',
			message: '',
			data: {
				has: await hasAdmin(),
			},
		};
	} catch (e) {
		return {
			status: 'failed',
			message: e,
		};
	}
});
