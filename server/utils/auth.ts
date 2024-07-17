import { md5 } from 'js-md5';
import type { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { getConfig } from '~/server/utils/config';

async function getSecret() {
	return (await getConfig()).auth.secret;
}

async function getUsers() {
	const users: { [key: string]: any } | null =
		await storage.getItem('users.json');
	if (users == null || typeof users != 'object') {
		await storage.setItem('users.json', {});
		return getUsers();
	}
	return users;
}

export async function hasUser(username: string) {
	const users = await getUsers();
	return Object.getOwnPropertyNames(users).includes(username);
}

export async function hasAdmin() {
	const users = await getUsers();
	for (const key in users) {
		if (users[key].permissions.includes('admin')) return true;
	}
	return false;
}

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

export async function getUser(username: string) {
	const users = await getUsers();
	return users[username];
}

async function generateToken(username: string, rememberMe: boolean = false) {
	const config = await getConfig();
	const expire = rememberMe ? config.auth.rememberMeExpire : config.auth.expire;
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
						new Date((<{ exp: number }>decoded).exp * 1000).toISOString(),
					);
				}
			})
			.catch((e) => {
				reject(e.message);
			});
	});
}

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

export async function deleteUser(username: string) {
	const users = await getUsers();
	users[username] = undefined;
}

export async function hasPermission(
	permissionList: string[],
	permission: string,
) {
	for (const perm of permissionList) {
		if (matchPermission(perm, permission)) return true;
	}
	return false;
}

function matchPermission(a: string, b: string) {
	const nodesA = a.split('.');
	const nodesB = b.split('.');
	for (let i = 0; i < nodesA.length; i++) {
		if (nodesA[i] != '*' && nodesA[i] != nodesB[i]) return false;
	}
	return true;
}
