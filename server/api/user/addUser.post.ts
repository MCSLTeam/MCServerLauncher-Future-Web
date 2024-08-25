import { hasAdmin , addUser } from '~/server/utils/auth';

export default defineEventHandler(async (event) =>{
	const body = await readBody(event);
	const username = body.username;
	const password = body.password;
	const permissions = body.permissions;
	try {
		const has :boolean = await hasAdmin();
		if (!username || !password) throw '用户名和密码不能为空';
		for (const i in permissions){
			if (permissions[i] == "admin" && has){
				throw '已有管理员用户';
			}
		}
		await addUser(username, password, permissions);
		console.log('新用户已注册，用户名：' + username);
		return {
			status: 'ok',
			message: '',
		};
	} catch (e) {
		return {
			status: 'error',
			message: e,
		};
	}
});