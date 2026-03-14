import { d as defineEventHandler, r as readBody } from '../../../runtime.mjs';
import { v as verifyToken, a as hasPermission, g as getUsernameByToken } from '../../../_/auth.mjs';
import { c as checkUpdate } from '../../../_/update.mjs';
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
import 'unzipper';

const check_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = body.token;
  try {
    await verifyToken(token);
    if (!await hasPermission(
      await getUsernameByToken(token),
      "mcsl.web.update"
    ))
      throw "\u6CA1\u6709\u6743\u9650";
    return {
      status: "ok",
      message: "",
      data: {
        update: await checkUpdate()
      }
    };
  } catch (e) {
    return {
      status: "failed",
      message: e
    };
  }
});

export { check_post as default };
//# sourceMappingURL=check.post.mjs.map
