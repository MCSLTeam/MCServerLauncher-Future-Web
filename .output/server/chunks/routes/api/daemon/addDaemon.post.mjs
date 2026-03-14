import { d as defineEventHandler, r as readBody } from '../../../runtime.mjs';
import { v as verifyToken, a as hasPermission, g as getUsernameByToken } from '../../../_/auth.mjs';
import { a as addDaemon } from '../../../_/daemon.mjs';
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

const addDaemon_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = body.token;
  const name = body.name;
  const url = body.url;
  const daemonToken = body.daemonToken;
  try {
    if (!name || !url || !daemonToken)
      throw "\u5B88\u62A4\u8FDB\u7A0B\u540D\u79F0\u3001URL\u6216Token\u4E0D\u80FD\u4E3A\u7A7A";
    await verifyToken(token);
    if (!await hasPermission(
      await getUsernameByToken(token),
      "mcsl.web.daemon.add"
    ))
      throw "\u6CA1\u6709\u6743\u9650";
    await addDaemon(name, url, daemonToken);
  } catch (e) {
    return {
      status: "failed",
      message: e
    };
  }
});

export { addDaemon_post as default };
//# sourceMappingURL=addDaemon.post.mjs.map
