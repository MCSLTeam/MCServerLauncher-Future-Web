import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import { a as defineDriver, c as createRequiredError, b as readFile, w as writeFile, e as unlink, f as readdirRecursive, g as rmRecursive, h as createError, i as createStorage } from '../runtime.mjs';
import { existsSync, promises } from 'fs';
import { resolve, relative, join } from 'path';
import { watch } from 'chokidar';
import anymatch from 'anymatch';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fs from 'fs-extra';
import { readdirSync, createWriteStream } from 'node:fs';
import axios from 'axios';
import { finished } from 'node:stream';
import { nanoid } from 'nanoid';

const PATH_TRAVERSE_RE = /\.\.\:|\.\.$/;
const DRIVER_NAME = "fs";
const fsDriver = defineDriver((opts = {}) => {
  if (!opts.base) {
    throw createRequiredError(DRIVER_NAME, "base");
  }
  if (!opts.ignore) {
    opts.ignore = ["**/node_modules/**", "**/.git/**"];
  }
  opts.base = resolve(opts.base);
  const r = (key) => {
    if (PATH_TRAVERSE_RE.test(key)) {
      throw createError(
        DRIVER_NAME,
        `Invalid key: ${JSON.stringify(key)}. It should not contain .. segments`
      );
    }
    const resolved = join(opts.base, key.replace(/:/g, "/"));
    return resolved;
  };
  let _watcher;
  const _unwatch = async () => {
    if (_watcher) {
      await _watcher.close();
      _watcher = void 0;
    }
  };
  return {
    name: DRIVER_NAME,
    options: opts,
    hasItem(key) {
      return existsSync(r(key));
    },
    getItem(key) {
      return readFile(r(key), "utf8");
    },
    getItemRaw(key) {
      return readFile(r(key));
    },
    async getMeta(key) {
      const { atime, mtime, size, birthtime, ctime } = await promises.stat(r(key)).catch(() => ({}));
      return { atime, mtime, size, birthtime, ctime };
    },
    setItem(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value, "utf8");
    },
    setItemRaw(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value);
    },
    removeItem(key) {
      if (opts.readOnly) {
        return;
      }
      return unlink(r(key));
    },
    getKeys() {
      return readdirRecursive(r("."), anymatch(opts.ignore || []));
    },
    async clear() {
      if (opts.readOnly || opts.noClear) {
        return;
      }
      await rmRecursive(r("."));
    },
    async dispose() {
      if (_watcher) {
        await _watcher.close();
      }
    },
    async watch(callback) {
      if (_watcher) {
        return _unwatch;
      }
      await new Promise((resolve2, reject) => {
        _watcher = watch(opts.base, {
          ignoreInitial: true,
          ignored: opts.ignore,
          ...opts.watchOptions
        }).on("ready", () => {
          resolve2();
        }).on("error", reject).on("all", (eventName, path) => {
          path = relative(opts.base, path);
          if (eventName === "change" || eventName === "add") {
            callback("update", path);
          } else if (eventName === "unlink") {
            callback("remove", path);
          }
        });
      });
      return _unwatch;
    }
  };
});

const __filename = fileURLToPath(globalThis._importMeta_.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, "../");
const dataDir = path.resolve(__dirname, "../mcsl-web");
const storage = createStorage({
  driver: fsDriver({ base: dataDir })
});
console.log("\u6570\u636E\u76EE\u5F55\uFF1A", dataDir);
async function backup() {
  const backupsDir = path.resolve(serverDir, "backup");
  const backupDir = path.resolve(
    backupsDir,
    "backup-" + (/* @__PURE__ */ new Date()).toISOString()
  );
  await fs.ensureDir(backupsDir);
  await fs.emptyDir(backupDir);
  await fs.ensureDir(backupDir);
  for (const file of readdirSync(serverDir)) {
    if (file != "backup")
      await fs.copy(
        path.resolve(serverDir, file),
        path.resolve(backupDir, file)
      );
  }
}
async function downloadFile(url, path2) {
  console.log("\u6B63\u5728\u4E0B\u8F7D " + url + " \u5230 " + path2);
  const writer = createWriteStream(path2);
  const res = await axios.get(url, {
    responseType: "stream"
  });
  res.data.pipe(writer);
  return new Promise((resolve, reject) => {
    finished(writer, (err) => {
      if (err) {
        console.error("\u4ECE" + url + " \u4E0B\u8F7D\u6587\u4EF6\u5230 " + path2 + "\u5931\u8D25\uFF01");
        reject(err);
      } else {
        console.log("\u6587\u4EF6 " + path2 + " \u4E0B\u8F7D\u5B8C\u6210\uFF01");
        resolve();
      }
    });
  });
}

const defaultConfig = {
  auth: {
    secret: nanoid(128),
    // 私钥
    rememberMeExpire: "30d",
    // 记住我的token有效期
    expire: "1d"
    // 不记住我的token有效期
  },
  beian: ""
};
const load = loadConfig();
async function saveDefaultConfig() {
  if (!await storage.hasItem("config.json")) {
    await storage.setItem("config.json", defaultConfig);
    console.warn("\u914D\u7F6E\u6587\u4EF6\u4E0D\u5B58\u5728\uFF01\u5DF2\u521B\u5EFA\u65B0\u914D\u7F6E\u6587\u4EF6\uFF01");
  }
}
async function loadConfig() {
  await saveDefaultConfig();
  let config = await storage.getItem("config.json");
  if (typeof config !== "object") {
    config = defaultConfig;
    console.warn("\u914D\u7F6E\u6587\u4EF6\u683C\u5F0F\u9519\u8BEF\uFF01\u5DF2\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\u914D\u7F6E\u6587\u4EF6\uFF01");
  }
  fillMissingValues(config, defaultConfig);
  console.log("\u5DF2\u52A0\u8F7D\u914D\u7F6E\u6587\u4EF6");
  await saveConfig(config);
}
async function saveConfig(config) {
  await saveDefaultConfig();
  await storage.setItem("config.json", config);
  console.log("\u5DF2\u4FDD\u5B58\u914D\u7F6E\u6587\u4EF6");
}
function fillMissingValues(config, defaultConfig2, parentKey) {
  for (const key in defaultConfig2) {
    if (!(key in config)) {
      config[key] = defaultConfig2[key];
      console.warn(
        "\u914D\u7F6E\u6587\u4EF6\u7F3A\u5931\u952E\u201C" + (parentKey == null ? "" : parentKey + ".") + key + "\u201D\uFF01\u5DF2\u91CD\u7F6E\u4E3A\uFF1A",
        defaultConfig2[key]
      );
    } else if (typeof config[key] !== typeof defaultConfig2[key]) {
      config[key] = defaultConfig2[key];
      console.warn(
        "\u914D\u7F6E\u6587\u4EF6\u4E2D\u952E\u201C" + (parentKey == null ? "" : parentKey + ".") + key + "\u201D\u7684\u503C\u7C7B\u578B\u9519\u8BEF\uFF01\u5DF2\u91CD\u7F6E\u4E3A\uFF1A",
        defaultConfig2[key]
      );
    } else if (typeof defaultConfig2[key] == "object") {
      fillMissingValues(
        config[key],
        defaultConfig2[key],
        parentKey == null ? key : parentKey + "." + key
      );
    }
  }
  return config;
}
async function getConfig() {
  await load;
  return await storage.getItem("config.json");
}

export { serverDir as a, backup as b, downloadFile as d, getConfig as g, storage as s };
//# sourceMappingURL=config.mjs.map
