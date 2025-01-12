import path from 'node:path';
import * as fs from 'node:fs';
import * as fse from 'fs-extra';
import * as unzipper from 'unzipper';
import * as crypto from 'crypto';
import axios from 'axios';

/**
 * 检查更新
 * @returns 更新信息
 * @throws unknown - 更新失败
 */
export async function checkUpdate() {
	const update = (await axios.get(useAppConfig().updater)).data;
	if (update.version != (await useAppConfig().appVersion())) return update;
	return null;
}

/**
 * 更新
 * @param update - 更新信息
 * @param stop - 是否在更新后停止程序
 */
export async function update(update: any, stop: boolean = false) {
	console.log('Start updating MCSL Future Web...');
	console.log('Backing up...');
	await backup();
	console.log('Downloading the latest version...');
	const updateFilePath = path.resolve(serverDir, 'MCSL_Future_Web.zip');
	await downloadFile(update.file_url, updateFilePath);
	console.log('Verifying...');
	if ((await sha1Sum(updateFilePath)) != update.file_sha1) {
		await fse.remove(updateFilePath);
		console.error('Verification failed!');
		throw 'verification-failed';
	}
	console.log('Removing old files...');
	await emptyServerDir();
	console.log('Unzipping update files...');
	await (
		await unzipper.Open.file(updateFilePath)
	).extract({ path: serverDir });
	console.log('Deleting update archive...');
	await fse.remove(updateFilePath);
	console.log('Done updating!');
	if (stop) process.exit(0);
}

async function sha1Sum(filePath: string) {
	const stream = fs.createReadStream(filePath);
	const sha1 = crypto.createHash('sha1');
	return new Promise((resolve) => {
		stream.on('data', (chunk) => {
			sha1.update(chunk);
		});
		stream.on('end', () => {
			const md5 = sha1.digest('hex');
			resolve(md5);
		});
	});
}

async function emptyServerDir() {
	const files = ['public', 'server', 'nitro.json'];
	for (const file of files) {
		await fse.remove(path.resolve(serverDir, file));
	}
}
