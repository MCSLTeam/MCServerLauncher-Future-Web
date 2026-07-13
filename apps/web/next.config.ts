import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isExport = process.env.NEXT_EXPORT === "1";
const appDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/locales"],
  outputFileTracingRoot: path.join(appDir, "../.."),
  ...(isExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: "http://127.0.0.1:11451/api/:path*",
            },
          ];
        },
      }),
};

export default nextConfig;
