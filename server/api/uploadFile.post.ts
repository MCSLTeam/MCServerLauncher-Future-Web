import path from 'node:path';
import * as fs from 'node:fs';

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const token = body.token;
	const name: string = body.name;
	const content: string = body.content;
	try {
		await requireEula();
		await requireParam(name, content);
		await isAuthed(token);
		await matchTokenPermission(token, 'mcsl.web.file.download');
		const file = path.resolve(cacheDir, Date.now().toString());
		const bytes = [];
		for (let i = 0; i < content.length; i++) {
			bytes.push(content.charCodeAt(i));
		}
		fs.writeFileSync(file, new Uint16Array(bytes));
		return {
			status: 'ok',
			message: '',
			data: {
				fileId: generateFileId(name, file),
			},
		};
	} catch (e) {
		console.log(e);
		return {
			status: 'failed',
			message: e,
		};
	}
});
