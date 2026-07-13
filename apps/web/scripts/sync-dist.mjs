import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const source = join(root, "out");
const distDir = join(root, "dist");

if (!existsSync(source)) {
  console.error("Next.js export output not found (expected ./out)");
  process.exit(1);
}

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
cpSync(source, distDir, { recursive: true });
console.log(`Synced static export from ${source} -> ${distDir}`);
