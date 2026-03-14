import { d as defineEventHandler } from '../../../runtime.mjs';
import { h as hasAdmin } from '../../../_/auth.mjs';
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

const hasAdmin_get = defineEventHandler(async () => {
  return {
    status: "ok",
    message: "",
    data: {
      has: await hasAdmin()
    }
  };
});

export { hasAdmin_get as default };
//# sourceMappingURL=hasAdmin.get.mjs.map
