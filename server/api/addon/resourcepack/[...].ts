import * as fs from 'node:fs';
import path from 'node:path';
import mime from 'mime';

export default defineEventHandler(async (event) => {
	const resourcePath = event.context.params._;
	try {
		await requireEula();
		const absPath = path.resolve(resourcepackDir, resourcePath);
		setHeader(
			event,
			'Content-Type',
			mime.getType(absPath) + ';charset=utf-8',
		);
		return fs.readFileSync(absPath);
	} catch (e) {
		console.log(e);
		setResponseStatus(event, 403);
		return {
			status: 'failed',
			message: e,
		};
	}
});
