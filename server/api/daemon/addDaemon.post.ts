export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	const name = body.name;
	const url = body.url;
	const daemonToken = body.daemonToken;
	try {
		requireParam(name, url, daemonToken)
		await isAuthed(token)
		await matchTokenPermission(token, 'mcsl.web.daemon.add')
		await addDaemon(name, url, daemonToken);
	} catch (e) {
		return {
			status: 'failed',
			message: e,
		};
	}
});
