export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	try {
		const expire = await getTokenExpire(token);
		return {
			status: 'ok',
			data: {
				expire: expire,
			},
			message: '',
		};
	} catch (e) {
		return {
			status: 'failed',
			message: e,
		};
	}
});
