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
- Protocol: sole `ws(s)://host:port/api/v2?token=...` endpoint; JSON-RPC 2.0 requests/responses, typed event notifications, and versioned binary frames. Do not restore V1 action/event envelopes or fallback parsing.
- Protocol authority: the .NET daemon's frozen typed catalog (`rpc.discover` for runtime OpenRPC; HTTP `GET /apifox.json` for catalog-derived Apifox). Wire contracts and binary codec live in `MCServerLauncher.Common/Contracts/Protocol`; RPC/event descriptors live in `MCServerLauncher.Daemon.API/Protocol/BuiltInProtocolDefinitions.cs`.
- V2 client method/DTO definitions must match the catalog, not historical protocol pages. Reconnect requires subscriptions and instance-catalog resynchronization; file/console sessions do not survive reconnect.
- Binary header version `1`, `mcsl.extension.v1`, and the separate plugin Registry API version are not daemon V1 compatibility paths.
