import { createStorage } from 'unstorage';
import fsDriver from 'unstorage/drivers/fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

export const __dirname = path.dirname(__filename);
export const dataDir = path.resolve(__dirname, '../mcsl-web');
export const storage = createStorage({
	driver: fsDriver({ base: dataDir }),
});

console.log('数据目录：', dataDir);
