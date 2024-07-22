export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	const stop = body.stop;
	try {
		await verifyToken(token);
		if ((await checkUpdate()) == null) throw '已是最新版本';
		if (
			!(await hasPermission(
				await getUsernameByToken(token),
				'mcsl.web.update',
			))
		)
			throw '没有权限';
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
