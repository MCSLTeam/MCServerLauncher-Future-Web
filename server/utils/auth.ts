import { md5 } from 'js-md5';
import type { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { getConfig } from '~/server/utils/config';

/**
 * @description 返回配置文件中的私钥
 */
async function getSecret() {
	return (await getConfig()).auth.secret;
}

/**
 * @description 获取所有用户
 */
async function getUsers() {
	const users: { [key: string]: any } | null =
		await storage.getItem('users.json');
	if (users == null || typeof users != 'object') {
		await storage.setItem('users.json', {});
		return getUsers();
	}
	return users;
}

/**
 * @description 是否存在用户
 * @param username string
 */
export async function hasUser(username: string) {
	const users = await getUsers();
	return Object.getOwnPropertyNames(users).includes(username);
}

/**
 * @description 是否存在管理员
 */
export async function hasAdmin() {
	const users = await getUsers();
	for (const key in users) {
		if (users[key].permissions.includes('admin')) return true;
	}
	return false;
}

/**
 * @description 增加用户
 * @param username string
 * @param password string
 * @param permissions string[]
 * @throws Error 用户已存在则抛出异常
 */
export async function addUser(
	username: string,
	password: string,
	permissions: string[],
) {
	if (await hasUser(username)) throw new Error('用户已存在');
	const users = await getUsers();
	users[username] = {
		permissions: permissions,
		password: md5(password),
	};
	await storage.setItem('users.json', users);
}

/**
 * @description 获取指定用户
 * @param username string
 */
export async function getUser(username: string) {
	const users = await getUsers();
	return users[username];
}

/**
 * @description 生成token
 * @param username string
 * @param rememberMe boolean
 */
async function generateToken(username: string, rememberMe: boolean = false) {
	const config = await getConfig();
	const expire = rememberMe
		? config.auth.rememberMeExpire
		: config.auth.expire;
	return jwt.sign(
		{
			username: username,
		},
		await getSecret(),
		{
			expiresIn: expire,
		},
	);
}

/**
 * @description 通过token获得用户名字
 * @param token string
 */
export async function getUsernameByToken(token: string) {
	return new Promise<string>((resolve, reject) => {
		getSecret()
			.then((secret) => {
				jwt.verify(token, secret, (err, decoded) => {
					if (decoded && (<JwtPayload>decoded).username)
						resolve((<JwtPayload>decoded).username);
					reject(err ?? new Error('无效的Token'));
				});
			})
			.catch((e) => reject(e ?? new Error('无效的Token')));
	});
}

/**
 * @description 获取token的有效时间
 * @param token string
 * @throws string 无效Token（过期、未知用户等）则抛出异常
 */
export function getTokenExpire(token: string) {
	return new Promise<string>((resolve, reject) => {
		getSecret()
			.then(async (secret) => {
				if (!(await getUsers())[await getUsernameByToken(token)]) {
					reject('未知用户');
					return;
				}
				const decoded = jwt.verify(token, secret);
				if (decoded && (<JwtPayload>decoded).exp) {
					resolve(
						new Date(
							(<{ exp: number }>decoded).exp * 1000,
						).toISOString(),
					);
				}
			})
			.catch((e) => {
				reject(e.message);
			});
	});
}

/**
 * @description 登录
 * @param username string
 * @param password string
 * @param rememberMe boolean
 * @returns Promise<string> 密码正确返回Token
 * @throws Error 密码错误抛出异常
 */
export async function login(
	username: string,
	password: string,
	rememberMe: boolean,
) {
	const users = await getUsers();
	if (users[username] && users[username].password == md5(password)) {
		console.log('用户' + username + '已登录');
		return await generateToken(username, rememberMe);
	}
	throw new Error('用户名或密码错误');
}

/**
 * @description 删除用户
 * @param username string
 */
export async function deleteUser(username: string) {
	const users = await getUsers();
	users[username] = undefined;
}

/**
 * @description 是否存在此权限，调用{@link matchPermission}
 * @param permissionList string[]
 * @param permission string
 */
export async function hasPermission(
	permissionList: string[],
	permission: string,
) {
	for (const perm of permissionList) {
		if (matchPermission(perm, permission)) return true;
	}
	return false;
}

/**
 * @description 匹配权限
 * @param a 权限列表中的一项
 * @param b 要匹配的权限
 */
function matchPermission(a: string, b: string) {
	const nodesA = a.split('.');
	const nodesB = b.split('.');
	for (let i = 0; i < nodesA.length; i++) {
		if (nodesA[i] != '*' && nodesA[i] != nodesB[i]) return false;
	}
	return true;
}
