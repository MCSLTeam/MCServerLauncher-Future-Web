export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const username = body.username;
	const password = body.password;
	const rememberMe = body.rememberMe ?? false;
	try {
		requireParam(username, password);
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
