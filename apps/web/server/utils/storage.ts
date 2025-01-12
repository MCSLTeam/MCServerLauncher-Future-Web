import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "fs-extra";
import { createWriteStream, readdirSync } from "node:fs";
import axios from "axios";
import { finished } from "node:stream";
import fsExtra from "fs-extra/esm";

const __filename = fileURLToPath(import.meta.url);

/**
 * 当前目录（./server/）
 */
export const __dirname = path.dirname(__filename);
/**
 * 服务器目录（./）
 */
export const serverDir = path.resolve(__dirname, "../");
/**
 * 数据目录（./mcsl-web）
 */
export const dataDir = path.resolve(__dirname, "../mcsl-web");
export const cacheDir = path.resolve(dataDir, "cache");
export const addonDir = path.resolve(dataDir, "addon");
export const resourcepackDir = path.resolve(addonDir, "resourcepack");
export const pluginDir = path.resolve(addonDir, "plugin");
const fileIds: ({ name: string; path: string } | undefined | null)[] = [];

console.log("Data directory: ", dataDir);
fsExtra.removeSync(cacheDir);
console.log("Cleaned cache");
fs.ensureDirSync(dataDir);
fs.ensureDirSync(cacheDir);
fs.ensureDirSync(addonDir);
fs.ensureDirSync(resourcepackDir);
fs.ensureDirSync(pluginDir);
console.log("Ensured directory");

/**
 * 文件存储
 */
export const storage = createStorage({
  driver: fsDriver({ base: dataDir }),
});

/**
 * 备份MCSL Future Web
 */
export async function backup() {
  const backupsDir = path.resolve(serverDir, "backup");
  const backupDir = path.resolve(
    backupsDir,
    "backup-" + new Date().toISOString(),
  );
  await fs.ensureDir(backupsDir);
  await fs.emptyDir(backupDir);
  await fs.ensureDir(backupDir);
  for (const file of readdirSync(serverDir)) {
    if (file != "backup")
      await fs.copy(
        path.resolve(serverDir, file),
        path.resolve(backupDir, file),
      );
  }
}

/**
 * 下载文件
 * @param url - 下载地址
 * @param path - 保存路径
 * @throws unknown - 下载失败
 */
export async function downloadFile(url: string, path: string): Promise<void> {
  console.log('Downloading "' + url + '" to "' + path + '"');
  const writer = createWriteStream(path);
  const res = await axios.get(url, {
    responseType: "stream",
  });
  res.data.pipe(writer);
  return new Promise((resolve, reject) => {
    finished(writer, (err) => {
      if (err) {
        console.error('Failed to download "' + url + '" to "' + path + '"!');
        reject(err);
      } else {
        console.log('Downloaded file "' + path + '"!');
        resolve();
      }
    });
  });
}

export function generateFileId(name: string, path: string) {
  fileIds.push({
    name: name,
    path: path,
  });
  return fileIds.length - 1;
}

export function getInfoByFileId(id: number): { name: string; path: string } {
  const item = fileIds[id];
  if (!item) throw "unknown-fileid";
  return item;
}

export function removeFileId(id: number) {
  fileIds[id] = null;
}
