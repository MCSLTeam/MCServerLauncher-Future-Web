export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const username = body.username;
	const password = body.password;
	const rememberMe = body.rememberMe ?? false;
	try {
		if (!username || !password) throw '用户名和密码不能为空';
		const token = await login(username, password, rememberMe);
		return {
			status: 'ok',
			data: {
				token: token,
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
