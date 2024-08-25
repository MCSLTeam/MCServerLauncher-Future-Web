export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	const stop = body.stop;
	try {
		await verifyToken(token);
		if ((await checkUpdate()) == null) throw 'up-to-date';
		if (
			!(await hasPermission(
				await getUsernameByToken(token),
				'mcsl.web.update',
			))
		)
			throw 'permission-denied';
		update(await checkUpdate(), stop);
		return {
			status: 'async',
			message: '',
		};
	} catch (e) {
		return {
			status: 'failed',
			message: e,
		};
	}
});
