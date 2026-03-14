import { s as storage } from './config.mjs';

async function getDaemons() {
  const daemons = await storage.getItem("daemons.json");
  if (daemons == null || typeof daemons != "object") {
    await storage.setItem("daemons.json", {});
    return getDaemons();
  }
  return daemons;
}
async function hasDaemon(name) {
  const daemons = await getDaemons();
  return Object.getOwnPropertyNames(daemons).includes(name);
}
async function addDaemon(name, url, token) {
  if (await hasDaemon(name))
    throw new Error("\u5B88\u62A4\u8FDB\u7A0B\u5DF2\u5B58\u5728");
  const daemons = await getDaemons();
  daemons[name] = {
    url,
    token
  };
  await storage.setItem("daemons.json", daemons);
}
async function removeDaemon(name) {
  const daemons = await getDaemons();
  daemons[name] = void 0;
  await storage.setItem("daemons.json", daemons);
}

export { addDaemon as a, getDaemons as g, removeDaemon as r };
//# sourceMappingURL=daemon.mjs.map
