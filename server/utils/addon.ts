import path from 'node:path';
import * as unzipper from 'unzipper';
import fsExtra from 'fs-extra/esm';

export async function importResourcepack(filePath: string) {
	const name = path.basename(filePath);
	const dest = path.resolve(resourcepackDir, name);
	await fsExtra.ensureDir(dest);
	try {
		await (await unzipper.Open.file(filePath)).extract({ path: dest });
	} catch (e) {
		await fsExtra.remove(dest);
		throw e;
	}
	const config = await getConfig();
	config.resourcepacks.push({
		url: name,
		enabled: true,
		type: 'local',
	});
	await saveConfig(config);
}
