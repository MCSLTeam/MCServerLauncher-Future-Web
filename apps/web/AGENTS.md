# MCServerLauncher-Future-Web/apps/web Guide

## Overview

- **Frontend**: Next.js 16 (App Router) + React 19 + shadcn/ui + Tailwind CSS v4 + framer-motion
- **Backend**: Rust Actix-web (API + production static hosting from `dist/`)
- **Stack parity**: aligned with ME Frp v6 `apps/frontend-dashboard`

## Commands

```bash
# monorepo root
pnpm web:dev:frontend
pnpm web:dev:backend
pnpm web:dev
pnpm web:build
```

## Structure

```
apps/web/
├── app/                 # Next.js App Router
├── components/ui/       # shadcn/ui primitives
├── components/templates # ConsolePage / ConsolePanel surfaces
├── features/console/    # ConsoleShell layout (ME Frp v6 style)
├── lib/                 # cn() + API helpers
├── scripts/sync-dist.mjs
├── src/                 # Rust Actix backend
└── dist/                # static export for include_dir
```

## Notes

- Production: `NEXT_EXPORT=1 next build` then copy `out/` → `dist/`.
- Do not reintroduce HeroUI or `@repo/ui` into the web app.
- Prefer components under `components/ui` (shadcn style).

## Daemon integration

- Browser-side WS client: `lib/daemon/client.ts` + `lib/daemon/types.ts`
- Connection state: `features/nodes/daemon-provider.tsx` (`useDaemon`)
- Nodes / Instances / Instance detail pages consume live reports — no mock instances
- Protocol: `ws(s)://host:port/api/v1?token=...` action/event JSON (snake_case)
