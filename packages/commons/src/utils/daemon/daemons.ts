import { computed, ref } from "vue";
import MFPClient from "mfp-client";
import { formatError } from "../common.ts";
import { ElMessage } from "element-plus";

export type DaemonManager = {
  addDaemon: (info: DaemonStorage) => Promise<void>;
  getDaemonList: () => Promise<{ [key: string]: DaemonInfo }>;
  getToken: (id: string) => Promise<string>;
  updateDaemon: (id: string, info: DaemonUpdate) => Promise<void>;
  removeDaemon: (id: string) => Promise<void>;
};

export type DaemonStorage = {
  name: string;
  host: string;
  port: number;
  token: string;
  secure: boolean;
};

export type DaemonUpdate = {
  name: string;
  host: string;
  port: number;
  token?: string;
  secure: boolean;
};

export type DaemonInfo = {
  name: string;
  host: string;
  port: number;
  secure: boolean;
};

let daemonManager: DaemonManager = {
  addDaemon: async () => {},
  getDaemonList: async () => {
    return {};
  },
  getToken: async () => {
    return "";
  },
  updateDaemon: async () => {},
  removeDaemon: async () => {},
};
export const daemonList = ref<{ [key: string]: DaemonInfo }>({});
export const daemonConnections = ref<{ [key: string]: MFPClient }>({});
export const showDaemonList = ref(false);
export const canHideDaemonList = computed(
  () => Object.keys(daemonList.value).length != 0,
);

export async function connectDaemons(reconnect = false) {
  if (reconnect) {
    for (const key in daemonConnections.value) {
      disconnectDaemon(key);
    }
  }
  for (const key in daemonConnections.value) {
    if (!daemonList.value[key] || !daemonConnections.value[key]!.connected())
      disconnectDaemon(key);
  }
  for (const key in daemonList.value) {
    if (!daemonConnections.value[key]) await connectDaemon(key);
  }
}

export async function connectDaemon(id: string) {
  if (!daemonConnections.value[id]) {
    const daemon = daemonList.value[id];
    try {
      if (!daemon) throw "daemon-not-found";
      const token = await daemonManager.getToken(id);
      const client = new MFPClient(
        {
          ...daemon,
          token,
        },
        false,
      );
      await client.connect();
      daemonConnections.value[id] = client;
    } catch (e: any) {
      ElMessage.error(
        formatError("daemon.connect.failed.reconnect", e, {
          name: daemonList.value[id]!.name,
        }),
      );
      console.error(
        formatError("daemon.connect.failed", e, {
          name: daemonList.value[id]!.name,
        }),
        e,
      );
    }
  }
}

export function disconnectDaemon(name: string) {
  if (daemonConnections.value[name]) {
    daemonConnections.value[name].close();
    delete daemonConnections.value[name];
  }
}

export async function refreshDaemon() {
  try {
    daemonList.value = await daemonManager.getDaemonList();
  } catch (e) {
    ElMessage.error(formatError("daemon.list.failed", e));
    console.error(formatError("daemon.list.failed", e), e);
  }
  await connectDaemons();
  if (!canHideDaemonList.value) {
    showDaemonList.value = true;
  }
  setTimeout(() => refreshDaemon(), 60000);
}

export async function addDaemon(info: DaemonStorage, refresh = true) {
  try {
    await daemonManager.addDaemon(info);
    if (refresh) await refreshDaemon();
  } catch (e) {
    ElMessage.error(formatError("daemon.add.failed", e, { name: info.name }));
    console.error(formatError("daemon.add.failed", e, { name: info.name }), e);
  }
}

export async function removeDaemon(id: string, refresh = true) {
  try {
    await daemonManager.removeDaemon(id);
    if (refresh) await refreshDaemon();
  } catch (e) {
    ElMessage.error(
      formatError("daemon.remove.failed", e, {
        name: daemonList.value[id]!.name,
      }),
    );
    console.error(
      formatError("daemon.remove.failed", e, {
        name: daemonList.value[id]!.name,
      }),
      e,
    );
  }
}

export async function updateDaemon(
  id: string,
  info: DaemonUpdate,
  refresh = true,
) {
  try {
    if (!daemonList.value[id]) throw "daemon-not-found";
    await daemonManager.updateDaemon(id, info);
    if (refresh) await refreshDaemon();
  } catch (e) {
    ElMessage.error(
      formatError("daemon.update.failed", e, {
        name: daemonList.value[id]!.name,
      }),
    );
    console.error(
      formatError("daemon.update.failed", e, {
        name: daemonList.value[id]!.name,
      }),
      e,
    );
  }
}

export function setDaemonManager(manager: DaemonManager) {
  daemonManager = manager;
}
