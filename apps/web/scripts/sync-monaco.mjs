/**
 * Bundle Monaco Editor AMD assets into public/monaco/vs for MCSL Web offline use.
 * Source: monaco-editor package min/vs (no CDN).
 */
import { cpSync, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = dirname(fileURLToPath(import.meta.url));
const appRoot = join(root, "..");

const monacoPkg = dirname(require.resolve("monaco-editor/package.json"));
const source = join(monacoPkg, "min", "vs");
const dest = join(appRoot, "public", "monaco", "vs");

if (!existsSync(source)) {
  console.error(`[sync-monaco] source missing: ${source}`);
  process.exit(1);
}

mkdirSync(join(appRoot, "public", "monaco"), { recursive: true });
rmSync(dest, { recursive: true, force: true });
cpSync(source, dest, { recursive: true });

const marker = join(dest, "loader.js");
if (!existsSync(marker)) {
  console.error(`[sync-monaco] copy failed, missing ${marker}`);
  process.exit(1);
}

const sizeMb = statSync(source).isDirectory() ? 0 : 0;
console.log(`[sync-monaco] monaco-editor -> public/monaco/vs`);
console.log(`[sync-monaco] ready: ${marker}`);
void sizeMb;
