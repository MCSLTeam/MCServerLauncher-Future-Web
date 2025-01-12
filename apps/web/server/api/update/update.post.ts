export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	const stop = body.stop ?? false;
	try {
		await isAuthed(token);
		if ((await checkUpdate()) == null) throw 'up-to-date';
		await matchTokenPermission(token, 'mcsl.web.update');
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
