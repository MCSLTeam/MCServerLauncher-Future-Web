import { formatError } from "~/utils/common.ts";
import { useDatabase } from "@repo/commons/src/utils/uses.ts";
import { computed } from "vue";

const fetchInterval = 30000;

let dataCache: any = {};
let lastFetch = 0;

async function fetchData() {
  if (useAccount().loggedIn) {
    lastFetch = Date.now();
    const res: any = await $fetch("/api/database/get", {
      method: "POST",
      body: {
        token: useAccount().token,
      },
    });
    if (res.status == "ok") {
      dataCache = res.data;
      return true;
    } else {
      ElMessage.error(formatError("database.get.failed", res.message));
      return false;
    }
  }
}

async function setData() {
  if (await fetchData()) {
    const res: any = await $fetch("/api/database/set", {
      method: "POST",
      body: {
        token: useAccount().token,
        data: dataCache,
      },
    });
    if (res.status == "ok") {
      return true;
    } else {
      ElMessage.error(formatError("database.set.failed", res.message));
    }
  }
  return false;
}

export async function initDatabase() {
  await fetchData();
  useDatabase().injectDatabaseManager(<T>(key: string, defaultValue: T) =>
    computed<T>({
      get() {
        return dataCache[key] ?? defaultValue;
      },
      set(value) {
        dataCache[key] = value;
        setData();
      },
    }),
  );
  setInterval(() => {
    if (lastFetch + fetchInterval < Date.now()) fetchData();
  }, fetchInterval / 10);
}
