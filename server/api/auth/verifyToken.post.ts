export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	try {
		await requireEula()
		await requireParam(token);
		const data = await getTokenData(token);
		return {
			status: 'ok',
			data: data,
			message: '',
		};
	} catch (e) {
		return {
			status: 'failed',
			message: e,
		};
	}
});
