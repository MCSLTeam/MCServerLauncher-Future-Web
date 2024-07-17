import { hasAdmin } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const username = body.username;
	const password = body.password;
	try {
		if (!username || !password) throw new Error('用户名和密码不能为空');
		if (await hasAdmin()) throw new Error('已有管理员用户');
		await addUser(username, password, ['admin', '*']);
		console.log('管理员已注册，用户名：' + username);
		return {
			status: 'ok',
			message: '',
		};
	} catch (e) {
		return {
			status: 'error',
			message: (<Error>e).message,
		};
	}
});
