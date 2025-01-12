export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	const name = body.name;
	try {
		requireParam(name);
		await isAuthed(token);
		await matchTokenPermission(token, 'mcsl.web.daemon.remove');
		await removeDaemon(name);
	} catch (e) {
		return {
			status: 'failed',
			message: e,
		};
	}
});
