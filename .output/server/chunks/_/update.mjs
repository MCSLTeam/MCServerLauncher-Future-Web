import { b as backup, a as serverDir, d as downloadFile } from './config.mjs';
import path from 'node:path';
import * as fs$1 from 'node:fs';
import * as fs from 'fs-extra';
import * as unzipper from 'unzipper';
import * as require$$1 from 'crypto';
import axios from 'axios';
import { u as useAppConfig } from '../runtime.mjs';

async function checkUpdate() {
  const update2 = (await axios.get(useAppConfig().updater)).data;
  if (update2.version != await useAppConfig().appVersion())
    return update2;
  return null;
}
async function update(update2, stop = false) {
  console.log("\u5F00\u59CB\u66F4\u65B0MCSL Future Web...");
  console.log("\u6B63\u5728\u5907\u4EFD...");
  await backup();
  console.log("\u6B63\u5728\u4E0B\u8F7D\u65B0\u7248\u672C...");
  const updateFilePath = path.resolve(serverDir, "MCSL_Future_Web.zip");
  await downloadFile(update2.file_url, updateFilePath);
  console.log("\u6B63\u5728\u6821\u9A8C\u65B0\u7248\u672C...");
  if (await sha1Sum(updateFilePath) != update2.file_sha1) {
    await fs.remove(updateFilePath);
    console.error("\u66F4\u65B0\u6587\u4EF6\u6821\u9A8C\u5931\u8D25\uFF01");
    throw "\u66F4\u65B0\u6587\u4EF6\u6821\u9A8C\u5931\u8D25\uFF01";
  }
  console.log("\u6B63\u5728\u6E05\u7A7A\u65E7\u7248MCSL Future Web\u6587\u4EF6...");
  await emptyServerDir();
  console.log("\u6B63\u5728\u89E3\u538B\u65B0\u7248\u672C...");
  await (await unzipper.Open.file(updateFilePath)).extract({ path: serverDir });
  console.log("\u6B63\u5728\u5220\u9664\u66F4\u65B0\u538B\u7F29\u5305...");
  await fs.remove(updateFilePath);
  console.log("\u66F4\u65B0\u5B8C\u6210\uFF0C\u8BF7\u91CD\u542FMCSL Future Web\u4EE5\u5E94\u7528\u66F4\u65B0\uFF01");
  if (stop)
    process.exit(0);
}
async function sha1Sum(filePath) {
  const stream = fs$1.createReadStream(filePath);
  const sha1 = require$$1.createHash("sha1");
  return new Promise((resolve) => {
    stream.on("data", (chunk) => {
      sha1.update(chunk);
    });
    stream.on("end", () => {
      const md5 = sha1.digest("hex");
      resolve(md5);
    });
  });
}
async function emptyServerDir() {
  const files = ["public", "server", "nitro.json"];
  for (const file of files) {
    await fs.remove(path.resolve(serverDir, file));
  }
}

export { checkUpdate as c, update as u };
//# sourceMappingURL=update.mjs.map
