import { d as defineEventHandler, r as readBody } from '../../../runtime.mjs';
import { v as verifyToken, a as hasPermission, g as getUsernameByToken } from '../../../_/auth.mjs';
import { c as checkUpdate, u as update } from '../../../_/update.mjs';
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

const update_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = body.token;
  const stop = body.stop;
  try {
    await verifyToken(token);
    if (await checkUpdate() == null)
      throw "\u5DF2\u662F\u6700\u65B0\u7248\u672C";
    if (!await hasPermission(
      await getUsernameByToken(token),
      "mcsl.web.update"
    ))
      throw "\u6CA1\u6709\u6743\u9650";
    update(await checkUpdate(), stop);
    return {
      status: "async",
      message: ""
    };
  } catch (e) {
    return {
      status: "failed",
      message: e
    };
  }
});

export { update_post as default };
//# sourceMappingURL=update.post.mjs.map
