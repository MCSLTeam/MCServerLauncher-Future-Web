import { type MFPClientInfo } from 'mfp-client/dist/src/types';

/**
 * 获取守护进程列表
 */
export async function getDaemons() {
	const daemons: { [key: string]: MFPClientInfo } | null =
		await storage.getItem('daemons.json');
	if (daemons == null || typeof daemons != 'object') {
		await storage.setItem('daemons.json', {});
		return getDaemons();
	}
	return daemons;
}

/**
 * 根据名称获取守护进程
 * @param name - 守护进程名称
 * @returns 守护进程信息
 */
export async function getDaemon(name: string) {
	return (await getDaemons())[name];
}

/**
 * 是否存在守护进程
 * @param name - 守护进程名称
 * @returns 是否存在
 */
export async function hasDaemon(name: string) {
	const daemons = await getDaemons();
	return Object.getOwnPropertyNames(daemons).includes(name);
}

/**
 * 添加守护进程
 * @param name - 守护进程名称
 * @param info - 守护进程信息
 */
export async function addDaemon(name: string, info: MFPClientInfo) {
	if (await hasDaemon(name)) throw new Error('守护进程已存在');
	const daemons = await getDaemons();
	// TODO: 检测是否为全局token
	daemons[name] = info;
	await storage.setItem('daemons.json', daemons);
}

/**
 * 删除守护进程
 * @param name - 守护进程名称
 */
export async function removeDaemon(name: string) {
	const daemons: any = await getDaemons();
	daemons[name] = undefined;
	await storage.setItem('daemons.json', daemons);
}
