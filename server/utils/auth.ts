import type {JwtPayload} from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import {getConfig} from '~/server/utils/config';

/**
 * @description 返回配置文件中的私钥
 */
async function getSecret() {
	return (await getConfig()).auth.secret;
}

export async function encode(str: string) {
	const md5 = crypto.createHash('md5');
	return md5.update(str + (await getSecret())).digest('hex');
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
 * @throws string 用户已存在则抛出异常
 */
export async function addUser(
	username: string,
	password: string,
	permissions: string[],
) {
	if (await hasUser(username)) throw '用户已存在';
	const users = await getUsers();
	users[username] = {
		permissions: permissions,
		password: await encode(password),
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
			username: await encode(username),
		},
		await getSecret(),
		{
			expiresIn: expire,
		},
	);
}

/**
 * @description 通过token获取用户名字
 * @param token string
 * @throws string 无效Token（过期、未知用户等）则抛出异常
 */
export async function getUsernameByToken(token: string) {
	return new Promise<string>((resolve, reject) => {
		getSecret()
			.then((secret) => {
				jwt.verify(token, secret, async (err, decoded) => {
					if (decoded && (<JwtPayload>decoded).username)
						for (const user in await getUsers()) {
							if (
								(await encode(user)) ==
								(<JwtPayload>decoded).username
							)
								resolve(user);
						}
					reject(err?.message ?? '无效的Token');
				});
			})
			.catch((e) => reject(e?.message ?? '无效的Token'));
	});
}

/**
 * @description 获取token数据
 * @param token string
 * @throws string 无效Token（过期、未知用户等）则抛出异常
 */
export async function getTokenData(token: string) {
	const decoded = await verifyToken(token);
	return {
		expire: new Date(<number>decoded.exp * 1000).toISOString(),
		username: await getUsernameByToken(token),
	};
}

export async function verifyToken(token: string) {
	try {
		await getUsernameByToken(token);
	} catch (e) {
		throw '未知用户';
	}
	return <JwtPayload>jwt.verify(token, await getSecret());
}

/**
 * @description 登录
 * @param username string
 * @param password string
 * @param rememberMe boolean
 * @returns Promise<string> 密码正确返回Token
 * @throws string 密码错误抛出异常
 */
export async function login(
	username: string,
	password: string,
	rememberMe: boolean,
) {
	console.log(
		(await getUser(username)).password,
		password,
		await encode(password),
	);
	if (
		(await hasUser(username)) &&
		(await getUser(username)).password == (await encode(password))
	) {
		console.log('用户' + username + '已登录');
		return await generateToken(username, rememberMe);
	}
	throw '用户名或密码错误';
}

/**
 * @description 删除用户
 * @param username string
 */
export async function removeUser(username: string) {
	const users = await getUsers();
	users[username] = undefined;
	await storage.setItem('users.json', users);
}

/**
 * @description 是否存在此权限，调用{@link matchPermission}
 * @param username string
 * @param permission string
 */
export async function hasPermission(username: string, permission: string) {
	for (const perm of (await getUser(username)).permissions) {
		if (matchPermission(perm, permission)) return true;
	}
	return false;
}

/**
 * @description 匹配权限
 * @param a 权限列表中的一项
 * @param b 要匹配的权限
 */
function matchPermission(a: string, b: string): boolean {
	const pattern =
		a.replace('.', '\\s').replace('**', '.+').replace('*', '\\S+') +
		'(\\s.+)?';
	const input = b.replace('.', ' ');
	const regex = new RegExp('^' + pattern + '$');
	return regex.test(input);
}
