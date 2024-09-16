export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const username = body.username;
	const password = body.password;
	try {
		await requireEula();
		requireParam(username, password);
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
