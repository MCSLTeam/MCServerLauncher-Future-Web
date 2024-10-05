export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	const fileId = body.fileId;
	try {
		await requireEula();
		await requireParam(fileId);
		await isAuthed(token);
		await matchTokenPermission(token, 'mcsl.web.addon.resourcepack.edit');
		await importResourcepack(getInfoByFileId(parseInt(fileId)).path);
		await removeFileId(fileId);
		return {
			status: 'ok',
			message: '',
			data: {},
		};
	} catch (e) {
		console.log(e);
		return {
			status: 'failed',
			message: e,
		};
	}
});
