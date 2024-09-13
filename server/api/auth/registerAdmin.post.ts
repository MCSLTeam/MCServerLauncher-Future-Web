import {hasAdmin} from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const username = body.username;
	const password = body.password;
	try {
		if (!username || !password) throw 'invalid-params';
		if (await hasAdmin()) throw 'registry-disabled';
		await addUser(username, password, ['admin', '*']);
		console.log('Admin registered, username: ' + username);
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
