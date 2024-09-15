import type {JwtPayload} from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import {getConfig} from '~/server/utils/config';

/**
 * 返回配置文件中的私钥
 * @returns 私钥
 */
async function getSecret() {
    return (await getConfig()).auth.secret;
}

export async function md5(str: string) {
    const md5 = crypto.createHash('md5');
    return md5.update(str + (await getSecret())).digest('hex');
}

/**
 * 获取所有用户
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
 * 是否存在用户
 * @param username string
 */
export async function hasUser(username: string) {
    const users = await getUsers();
    return Object.getOwnPropertyNames(users).includes(username);
}

/**
 * 是否存在管理员
 */
export async function hasAdmin() {
    const users = await getUsers();
    for (const key in users) {
        if (users[key].permissions.includes('admin')) return true;
    }
    return false;
}

/**
 * 增加用户
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
    if (await hasUser(username)) throw 'user-exists';
    const users = await getUsers();
    users[username] = {
        permissions: permissions,
        id: crypto.randomUUID(),
        password: await md5(password),
    };
    await storage.setItem('users.json', users);
}

/**
 * 获取指定用户
 * @param username string
 */
export async function getUser(username: string) {
    const users = await getUsers();
    return users[username];
}

/**
 * 生成token
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
            userid: (await getUser(username)).id,
        },
        await getSecret(),
        {
            expiresIn: expire,
        },
    );
}

/**
 * 通过token获取用户名字
 * @param token string
 * @throws string 无效Token（过期、未知用户等）则抛出异常
 */
export async function getUsernameByToken(token: string) {
    return new Promise<string>((resolve, reject) => {
        getSecret()
            .then((secret) => {
                jwt.verify(
                    token,
                    secret,
                    async (err: Error | null, decoded: any) => {
                        if (decoded && decoded.userid)
                            for (const user in await getUsers()) {
                                if ((await getUser(user)).id == decoded.userid)
                                    resolve(user);
                            }
                        reject(err?.message ?? 'invalid-token');
                    },
                );
            })
            .catch((e) => reject(e?.message ?? 'invalid-token'));
    });
}

/**
 * 获取token数据
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
        throw 'unknown-user';
    }
    return <JwtPayload>jwt.verify(token, await getSecret());
}

/**
 * 登录
 * @param username string
 * @param password string
 * @param rememberMe boolean
 * @returns 密码正确返回Token
 * @throws string 密码错误抛出异常
 */
export async function login(
    username: string,
    password: string,
    rememberMe: boolean,
) {
    if (
        (await hasUser(username)) &&
        (await getUser(username)).password == (await md5(password))
    ) {
        console.log('User ' + username + ' logged in');
        return await generateToken(username, rememberMe);
    }
    throw 'login-failed';
}

/**
 * 删除用户
 * @param username string
 */
export async function removeUser(username: string) {
    const users = await getUsers();
    users[username] = undefined;
    await storage.setItem('users.json', users);
}

/**
 * 是否存在此权限，调用{@link matchPermission}
 * @param username string
 * @param permission string
 */
export async function hasPermission(username: string, permission: string) {
    for (const perm of (await getUser(username)).permissions) {
        try {
            if (matchPermission(perm, permission)) return true;
        } catch (e) {
            if (e != 'invalid-user-permission') throw e;
        }
    }
    return false;
}

/**
 * 匹配权限
 * @param a - 权限列表中的一项
 * @param b - 要匹配的权限
 */
function matchPermission(a: string, b: string): boolean {
    if (!/^(([a-zA-Z-_]+|\*{1,2})\.)*([a-zA-Z-_]+|\*{1,2})$/.test(a))
        throw 'invalid-user-permission';
    if (!/^(([a-zA-Z-_]+)\.)*([a-zA-Z-_]+)$/.test(b))
        throw 'invalid-matching-permission';
    const pattern =
        a
            .replaceAll('.', '\\s')
            .replaceAll('**', '.+')
            .replaceAll('*', '\\S+') + '(\\s.+)?';
    const input = b.replaceAll('.', ' ');
    const regex = new RegExp('^' + pattern + '$');
    return regex.test(input);
}
