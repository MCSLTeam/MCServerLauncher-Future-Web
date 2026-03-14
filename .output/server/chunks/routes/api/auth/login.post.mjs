import { d as defineEventHandler, r as readBody } from '../../../runtime.mjs';
import { l as login } from '../../../_/auth.mjs';
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

const login_post = defineEventHandler(async (event) => {
  var _a;
  const body = await readBody(event);
  const username = body.username;
  const password = body.password;
  const rememberMe = (_a = body.rememberMe) != null ? _a : false;
  try {
    if (!username || !password)
      throw "\u7528\u6237\u540D\u548C\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A";
    const token = await login(username, password, rememberMe);
    return {
      status: "ok",
      data: {
        token
      },
      message: ""
    };
  } catch (e) {
    return {
      status: "failed",
      message: e
    };
  }
});

export { login_post as default };
//# sourceMappingURL=login.post.mjs.map
