export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	const permission = body.permission;
	try {
		if (!permission) throw '权限名称不能为空';
		await verifyToken(token);
		return {
			status: 'ok',
			data: {
				has: await hasPermission(
					await getUsernameByToken(token),
					permission,
				),
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
