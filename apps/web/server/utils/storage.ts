import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "fs-extra";
import { createWriteStream, readdirSync } from "node:fs";
import axios from "axios";
import { finished } from "node:stream";

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

console.log("Data directory: ", dataDir);
fs.ensureDirSync(dataDir);
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
