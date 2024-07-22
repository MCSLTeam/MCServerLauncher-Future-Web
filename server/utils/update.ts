import path from 'node:path';
import {serverDir} from '~/server/utils/storage';
import * as fs from 'node:fs';
import * as fse from 'fs-extra';
import * as unzipper from 'unzipper';
import * as crypto from 'crypto';
import axios from 'axios';

export async function checkUpdate() {
    try {
        const update = (await axios.get(useAppConfig().updater)).data;
        if (update.version != (await useAppConfig().appVersion())) return update;
        return null;
    } catch (e) {
        throw '无法获取更新信息！'
    }
}

export async function update(update: any, stop: boolean = false) {
    console.log('开始更新MCSL Future Web...');
    console.log('正在备份...');
    await backup();
    console.log('正在下载新版本...');
    const updateFilePath = path.resolve(serverDir, 'MCSL_Future_Web.zip');
    await downloadFile(update.file_url, updateFilePath);
    console.log('正在校验新版本...');
    if ((await sha1Sum(updateFilePath)) != update.file_sha1) {
        await fse.remove(updateFilePath);
        console.error('更新文件校验失败！');
        throw '更新文件校验失败！';
    }
    console.log('正在清空旧版MCSL Future Web文件...');
    await emptyServerDir();
    console.log('正在解压新版本...');
    await (
        await unzipper.Open.file(updateFilePath)
    ).extract({path: serverDir});
    console.log('正在删除更新压缩包...');
    await fse.remove(updateFilePath);
    console.log('更新完成，请重启MCSL Future Web以应用更新！');
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
