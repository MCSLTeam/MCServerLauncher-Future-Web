import {hasPermission} from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	const name = body.name;
	try {
		await verifyToken(token);
		if (
			!(await hasPermission(
				await getUsernameByToken(token),
				'mcsl.web.daemon.remove',
			))
		)
			throw 'permission-denied';
		await removeDaemon(name);
	} catch (e) {
		return {
			status: 'failed',
			message: e,
		};
	}
});
