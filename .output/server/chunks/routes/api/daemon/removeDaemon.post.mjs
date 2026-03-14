import { d as defineEventHandler, r as readBody } from '../../../runtime.mjs';
import { v as verifyToken, a as hasPermission, g as getUsernameByToken } from '../../../_/auth.mjs';
import { r as removeDaemon } from '../../../_/daemon.mjs';
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

const removeDaemon_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = body.token;
  const name = body.name;
  try {
    await verifyToken(token);
    if (!await hasPermission(
      await getUsernameByToken(token),
      "mcsl.web.daemon.remove"
    ))
      throw "\u6CA1\u6709\u6743\u9650";
    await removeDaemon(name);
  } catch (e) {
    return {
      status: "failed",
      message: e
    };
  }
});

export { removeDaemon_post as default };
//# sourceMappingURL=removeDaemon.post.mjs.map
