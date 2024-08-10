export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	const name = body.name;
	const url = body.url;
	const daemonToken = body.daemonToken;
	try {
		if (!name || !url || !daemonToken)
			throw '守护进程名称、URL或Token不能为空';
		await verifyToken(token);
		if (
			!(await hasPermission(
				await getUsernameByToken(token),
				'mcsl.web.daemon.add',
			))
		)
			throw '没有权限';
		await addDaemon(name, url, daemonToken);
	} catch (e) {
		return {
			status: 'failed',
			message: e,
		};
	}
});
