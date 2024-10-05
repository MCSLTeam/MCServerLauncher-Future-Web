import path from 'node:path';

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	const name: string = body.name;
	const url: string = body.url;
	try {
		await requireEula();
		await requireParam(name, url);
		await isAuthed(token);
		await matchTokenPermission(token, 'mcsl.web.file.download');
		const file = path.resolve(cacheDir, Date.now());
		await downloadFile(url, file);
		return {
			status: 'ok',
			message: '',
			data: {
				fileId: generateFileId(name, file),
			},
		};
	} catch (e) {
		return {
			status: 'failed',
			message: e,
		};
	}
});
