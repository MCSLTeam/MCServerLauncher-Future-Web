export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	try {
		const daemons = [];
		for (const daemon in await getDaemons()) {
			if (
				await hasPermission(
					await getUsernameByToken(token),
					'mcsl.web.daemon.' + daemon + '.access',
				)
			)
				daemons.push(daemon);
		}
		return {
			status: 'ok',
			data: {
				daemons: daemons,
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
