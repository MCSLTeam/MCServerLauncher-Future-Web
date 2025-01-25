import { defaultConfig } from "~/server/utils/config";

const load = loadDatabase();

/**
 * 如果数据库不存在创建数据库
 */
export async function createDatabase() {
  // 判断是否存在
  if (!(await storage.hasItem("database.json"))) {
    await storage.setItem("database.json", defaultConfig);
    console.warn("Database does not exist! Creating new database!");
  }
}

/**
 * 加载数据库
 */
export async function loadDatabase() {
  // 确保配置文件存在
  await createDatabase();
  const database = await storage.getItem("database.json");
  if (typeof database !== "object") {
    await storage.setItem("database.json", {});
    console.warn("Wrong database format! Creating new database!");
  }
  console.log("Database loaded");
}

/**
 * 保存数据库
 * @param database - 数据库
 */
export async function saveDatabase(database: any) {
  if (typeof database !== "object") return;
  await load;
  await createDatabase();
  await storage.setItem("database.json", database);
  console.log("Saved database!");
}

/**
 * 获取配置文件
 * @returns 配置文件
 */
export async function getDatabase(): Promise<any> {
  await load;
  const db = <any>await storage.getItem("database.json");
  if (db == null) {
    await loadDatabase();
    return await getDatabase();
  }
  return db;
}
