import { s as storage, g as getConfig } from './config.mjs';
import jwt from 'jsonwebtoken';
import * as require$$1 from 'crypto';

async function getSecret() {
  return (await getConfig()).auth.secret;
}
async function encode(str) {
  const md5 = require$$1.createHash("md5");
  return md5.update(str + await getSecret()).digest("hex");
}
async function getUsers() {
  const users = await storage.getItem("users.json");
  if (users == null || typeof users != "object") {
    await storage.setItem("users.json", {});
    return getUsers();
  }
  return users;
}
async function hasUser(username) {
  const users = await getUsers();
  return Object.getOwnPropertyNames(users).includes(username);
}
async function hasAdmin() {
  const users = await getUsers();
  for (const key in users) {
    if (users[key].permissions.includes("admin"))
      return true;
  }
  return false;
}
async function addUser(username, password, permissions) {
  if (await hasUser(username))
    throw "\u7528\u6237\u5DF2\u5B58\u5728";
  const users = await getUsers();
  users[username] = {
    permissions,
    password: await encode(password)
  };
  await storage.setItem("users.json", users);
}
async function getUser(username) {
  const users = await getUsers();
  return users[username];
}
async function generateToken(username, rememberMe = false) {
  const config = await getConfig();
  const expire = rememberMe ? config.auth.rememberMeExpire : config.auth.expire;
  return jwt.sign(
    {
      username: await encode(username)
    },
    await getSecret(),
    {
      expiresIn: expire
    }
  );
}
async function getUsernameByToken(token) {
  return new Promise((resolve, reject) => {
    getSecret().then((secret) => {
      jwt.verify(token, secret, async (err, decoded) => {
        var _a;
        if (decoded && decoded.username)
          for (const user in await getUsers()) {
            if (await encode(user) == decoded.username)
              resolve(user);
          }
        reject((_a = err == null ? void 0 : err.message) != null ? _a : "\u65E0\u6548\u7684Token");
      });
    }).catch((e) => {
      var _a;
      return reject((_a = e == null ? void 0 : e.message) != null ? _a : "\u65E0\u6548\u7684Token");
    });
  });
}
async function getTokenData(token) {
  const decoded = await verifyToken(token);
  return {
    expire: new Date(decoded.exp * 1e3).toISOString(),
    username: await getUsernameByToken(token)
  };
}
async function verifyToken(token) {
  try {
    await getUsernameByToken(token);
  } catch (e) {
    throw "\u672A\u77E5\u7528\u6237";
  }
  return jwt.verify(token, await getSecret());
}
async function login(username, password, rememberMe) {
  if (await hasUser(username) && (await getUser(username)).password == await encode(password)) {
    console.log("\u7528\u6237" + username + "\u5DF2\u767B\u5F55");
    return await generateToken(username, rememberMe);
  }
  throw "\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF";
}
async function hasPermission(username, permission) {
  for (const perm of (await getUser(username)).permissions) {
    try {
      if (matchPermission(perm, permission))
        return true;
    } catch (e) {
      if (e != "\u7528\u6237\u6743\u9650\u683C\u5F0F\u9519\u8BEF")
        throw e;
    }
  }
  return false;
}
function matchPermission(a, b) {
  if (!/^(([a-zA-Z-_]+|\*{1,2})\.)*([a-zA-Z-_]+|\*{1,2})$/.test(a))
    throw "\u7528\u6237\u6743\u9650\u683C\u5F0F\u9519\u8BEF";
  if (!/^(([a-zA-Z-_]+)\.)*([a-zA-Z-_]+)$/.test(b))
    throw "\u5339\u914D\u6743\u9650\u683C\u5F0F\u9519\u8BEF";
  const pattern = a.replaceAll(".", "\\s").replaceAll("**", ".+").replaceAll("*", "\\S+") + "(\\s.+)?";
  const input = b.replaceAll(".", " ");
  const regex = new RegExp("^" + pattern + "$");
  return regex.test(input);
}

export { hasPermission as a, addUser as b, getTokenData as c, getUsernameByToken as g, hasAdmin as h, login as l, verifyToken as v };
//# sourceMappingURL=auth.mjs.map
