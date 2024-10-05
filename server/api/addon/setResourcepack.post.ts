export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	const resourcepacks: {
		url: string;
		enabled: boolean;
		type: 'local' | 'remote' | 'system';
	}[] = body.resourcepacks;
	try {
		await requireEula();
		await requireParam(resourcepacks);
		await isAuthed(token);
		await matchTokenPermission(token, 'mcsl.web.addon.resourcepack.edit');
		const config = await getConfig();
		config.resourcepacks = resourcepacks;
		await saveConfig(config);
		return {
			status: 'ok',
			message: '',
			data: {},
		};
	} catch (e) {
		return {
			status: 'failed',
			message: e,
		};
	}
});
