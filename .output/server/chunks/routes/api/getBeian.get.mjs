import { d as defineEventHandler } from '../../runtime.mjs';
import { g as getConfig } from '../../_/config.mjs';
import 'node:http';
import 'node:https';
import 'fs';
import 'path';
import 'node:fs';
import 'node:url';
import 'chokidar';
import 'anymatch';
import 'node:path';
import 'fs-extra';
import 'axios';
import 'node:stream';
import 'nanoid';

const getBeian_get = defineEventHandler(async () => {
  return {
    status: "ok",
    data: {
      beian: (await getConfig()).beian
    },
    message: ""
  };
});

export { getBeian_get as default };
//# sourceMappingURL=getBeian.get.mjs.map
