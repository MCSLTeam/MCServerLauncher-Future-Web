import { d as defineEventHandler, r as readBody } from '../../../runtime.mjs';
import { v as verifyToken, a as hasPermission, g as getUsernameByToken } from '../../../_/auth.mjs';
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

const hasPermission_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = body.token;
  const permission = body.permission;
  try {
    if (!permission)
      throw "\u6743\u9650\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A";
    await verifyToken(token);
    return {
      status: "ok",
      data: {
        has: await hasPermission(
          await getUsernameByToken(token),
          permission
        )
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

export { hasPermission_post as default };
//# sourceMappingURL=hasPermission.post.mjs.map
