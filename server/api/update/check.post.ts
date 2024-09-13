export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	try {
		await isAuthed(token);
		await matchTokenPermission('mcsl.web.update')
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
