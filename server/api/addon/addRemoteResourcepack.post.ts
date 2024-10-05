export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	const url = body.url;
	try {
		await requireEula();
		await requireParam(url);
		await isAuthed(token);
		await matchTokenPermission(token, 'mcsl.web.addon.resourcepack.edit');
		const config = await getConfig();
		const info = {
			url: url,
			enabled: false,
			type: 'remote',
		};
		if (config.resourcepacks.find((item) => item.url === info.url))
			throw 'resourcepack-exists';
		config.resourcepacks.push(info);
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
