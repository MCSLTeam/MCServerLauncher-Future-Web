import {
  getUser,
  getUsernameByToken,
  hasPermission,
} from "~/server/utils/user";
import type {
  DaemonInfo,
  DaemonStorage,
  DaemonUpdate,
} from "@repo/commons/src/utils/daemon/daemons";
import { customAlphabet } from "nanoid";
import { requestSubtoken } from "mfp-client";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz", 32);

const load = loadDaemonList();

async function createDaemonList() {
  // 判断是否存在
  if (!(await storage.hasItem("daemons.json"))) {
    await storage.setItem("daemons.json", {});
    console.warn("Daemon list does not exist! Creating new daemon list!");
  }
}

async function loadDaemonList() {
  // 确保配置文件存在
  await createDaemonList();
  const daemonList = await storage.getItem("daemons.json");
  if (typeof daemonList !== "object") {
    await storage.setItem("daemons.json", {});
    console.warn("Wrong daemon list format! Creating new daemon list!");
  }
  console.log("Daemon list loaded");
}

async function saveDaemonList(daemonList: { [key: string]: DaemonStorage }) {
  if (typeof daemonList !== "object") return;
  await load;
  await createDaemonList();
  await storage.setItem("daemons.json", daemonList);
  console.log("Saved daemon list!");
}

export async function getDaemonList(): Promise<{
  [key: string]: DaemonStorage;
}> {
  await load;
  const daemonList = <{ [key: string]: DaemonStorage }>(
    await storage.getItem("daemons.json")
  );
  if (daemonList == null) {
    await loadDaemonList();
    return await getDaemonList();
  }
  return daemonList;
}

export async function getDaemonListWithToken(
  token: string,
): Promise<{ [key: string]: DaemonInfo }> {
  const daemonList = await getDaemonList();
  const username = await getUsernameByToken(token);
  const daemons: { [key: string]: DaemonInfo } = {};
  for (const key in daemonList) {
    const info = daemonList[key];
    if (await hasPermission(username, "mcsl.web.daemon." + key + ".access")) {
      daemons[key] = {
        name: info.name,
        host: info.host,
        port: info.port,
        secure: info.secure,
      };
    }
  }
  return daemons;
}

export async function addDaemon(info: DaemonStorage) {
  let id = "";
  do {
    id = nanoid();
  } while (await hasDaemon(id));
  await saveDaemonList({
    ...(await getDaemonList()),
    [id]: info,
  });
}

export async function getDaemonToken(username: string, id: string) {
  if (!(await hasDaemon(id))) throw "daemon-not-found";
  const permissions = (await getUser(username)).permissions;
  try {
    return await requestSubtoken((await getDaemonList())[id], 30, permissions);
  } catch (e) {
    console.warn("An error occurred while trying to get subtoken: ", e);
    throw e;
  }
}

export async function hasDaemon(id: string) {
  return !!(await getDaemonList())[id];
}

export async function removeDaemon(id: string) {
  await saveDaemonList(
    Object.fromEntries(
      Object.entries(await getDaemonList()).filter(([key, _]) => key !== id),
    ),
  );
}

export async function updateDaemon(id: string, info: DaemonUpdate) {
  if (!(await hasDaemon(id))) throw "daemon-not-found";
  await saveDaemonList({
    ...(await getDaemonList()),
    [id]: {
      ...info,
      token: info.token ?? (await getDaemonList())[id].token,
    },
  });
}
