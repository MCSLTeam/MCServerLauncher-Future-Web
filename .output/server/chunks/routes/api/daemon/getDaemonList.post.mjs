import { d as defineEventHandler, r as readBody } from '../../../runtime.mjs';
import { g as getDaemons } from '../../../_/daemon.mjs';
import { a as hasPermission, g as getUsernameByToken } from '../../../_/auth.mjs';
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

const getDaemonList_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = body.token;
  try {
    const daemons = [];
    for (const daemon in await getDaemons()) {
      if (await hasPermission(
        await getUsernameByToken(token),
        "mcsl.web.daemon." + daemon + ".access"
      ))
        daemons.push(daemon);
    }
    return {
      status: "ok",
      data: {
        daemons
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

export { getDaemonList_post as default };
//# sourceMappingURL=getDaemonList.post.mjs.map
