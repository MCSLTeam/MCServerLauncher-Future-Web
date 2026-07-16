import { spawnSync } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

/**
 * Cross-platform static export build.
 * Windows cannot parse `NEXT_EXPORT=1 next build` as a Unix env assignment.
 */
const appDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.join(appDir, "..");
const require = createRequire(path.join(webDir, "package.json"));
const nextEntry = require.resolve("next/dist/bin/next");

const result = spawnSync(process.execPath, [nextEntry, "build"], {
  cwd: webDir,
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_EXPORT: "1",
  },
});

process.exit(result.status ?? 1);
