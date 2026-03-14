import { d as defineEventHandler, r as readBody } from '../../../runtime.mjs';
import { h as hasAdmin, b as addUser } from '../../../_/auth.mjs';
import 'node:http';
import 'node:https';
import 'fs';
import 'path';
import 'node:fs';
import 'node:url';
import '../../../_/config.mjs';
import 'chokidar';
import 'anymatch';
import 'node:path';
import 'fs-extra';
import 'axios';
import 'node:stream';
import 'nanoid';
import 'jsonwebtoken';
import 'crypto';

const registerAdmin_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const username = body.username;
  const password = body.password;
  try {
    if (!username || !password)
      throw "\u7528\u6237\u540D\u548C\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A";
    if (await hasAdmin())
      throw "\u5DF2\u6709\u7BA1\u7406\u5458\u7528\u6237";
    await addUser(username, password, ["admin", "*"]);
    console.log("\u7BA1\u7406\u5458\u5DF2\u6CE8\u518C\uFF0C\u7528\u6237\u540D\uFF1A" + username);
    return {
      status: "ok",
      message: ""
    };
  } catch (e) {
    return {
      status: "error",
      message: e
    };
  }
});

export { registerAdmin_post as default };
//# sourceMappingURL=registerAdmin.post.mjs.map
