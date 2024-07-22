export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	try {
		await verifyToken(token);
		if (
			!(await hasPermission(
				await getUsernameByToken(token),
				'mcsl.web.update',
			))
		)
			throw '没有权限';
		return {
			status: 'ok',
			message: '',
			data: {
				update: await checkUpdate(),
			},
		};
	} catch (e) {
		return {
			status: 'failed',
			message: e,
		};
	}
});
