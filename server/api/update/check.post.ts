export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	try {
		await requireEula();
		await isAuthed(token);
		await matchTokenPermission(token, 'mcsl.web.update');
		return {
			status: 'ok',
			message: '',
			data: {
				update: await checkUpdate(),
			},
		};
	} catch (e) {
		return {
			status: 'failed',
			message: e,
		};
	}
});
