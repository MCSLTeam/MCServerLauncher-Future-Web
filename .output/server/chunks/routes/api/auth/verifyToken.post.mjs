import { d as defineEventHandler, r as readBody } from '../../../runtime.mjs';
import { c as getTokenData } from '../../../_/auth.mjs';
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

const verifyToken_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = body.token;
  try {
    const data = await getTokenData(token);
    return {
      status: "ok",
      data,
      message: ""
    };
  } catch (e) {
    return {
      status: "failed",
      message: e
    };
  }
});

export { verifyToken_post as default };
//# sourceMappingURL=verifyToken.post.mjs.map
