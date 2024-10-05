import path from 'node:path';

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	try {
		await requireEula();
		await isAuthed(token);
		await matchTokenPermission(token, 'mcsl.web.addon.resourcepack.get');
		return {
			status: 'ok',
			message: '',
			data: {
				resourcepacks: (await getConfig()).resourcepacks.map(
					(resourcepack) => {
						if (resourcepack.type == 'local')
							resourcepack.url = path.join('/', resourcepack.url);
						if (
							resourcepack.type != 'system' &&
							!resourcepack.url.endsWith('addon.json')
						)
							resourcepack.url = path.join(
								resourcepack.url,
								'addon.json',
							);
						return resourcepack;
					},
				),
			},
		};
	} catch (e) {
		return {
			status: 'failed',
			message: e,
		};
	}
});
