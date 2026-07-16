# Create Instance WPF Parity + Download Flyout

> **For agentic workers:** Execute task-by-task. Steps use checkbox syntax.

**Goal:** Align Next.js create-instance with MCSL Future WPF options/logic (submittable flows + UI for incomplete ones), and implement resource download progress flyout.

**Architecture:** Extend `DaemonClient` for `add_instance` / `get_java_list` / binary file upload; build type-specific `InstanceFactorySetting` payloads matching WPF providers; client-side install-source fetch for Forge/Fabric/NeoForge/Quilt; browser download manager with header flyout for ResDownload progress.

**Tech Stack:** Next.js 16, React 19, TypeScript, WebSocket binary frames, shadcn UI, BMCLAPI/official meta endpoints.

**Touched areas:** `frontend`, `protocol` (client only)

---

### Task 1: Daemon client APIs

- [x] Types for factory setting / java list / upload
- [x] `add_instance`, `get_java_list`, binary upload chunk protocol
- [x] Expose via `useDaemon`

### Task 2: Create domain helpers

- [x] Validation (name, jar, java)
- [x] Setting builders (Java/Forge/Fabric/NeoForge/Quilt/Universal-like)
- [x] Install source list fetchers

### Task 3: Download flyout

- [x] Download manager store (fetch + blob progress)
- [x] Flyout UI in console header
- [x] Resource center wires to manager

### Task 4: Create wizard

- [x] WPF-aligned category → type → steps
- [x] Real submit for Java/Forge/Fabric/NeoForge
- [x] Quilt/Bedrock/Terraria/Other UI + best-effort submit

### Changelog

- 2026-07-15: Implemented WPF create-instance parity UI/logic and download progress flyout.
  - Daemon: binary upload frame helpers, `add_instance` / `get_java_list` / `uploadFile` on `DaemonClient` + `DaemonProvider`.
  - Create: types/validation/builders/install-source + `CreateWizard` (node → category → type → settings; real submit for mcje/forge/fabric/neoforge).
  - Downloads: `downloadManager`, `DownloadProvider`, header `DownloadHistoryFlyout`; resource-center uses manager instead of `location.assign`.
  - Soft i18n keys for create steps and download history.
  - Verification: `pnpm exec tsc --noEmit` in `apps/web` passed.
  - Follow-up risk: live daemon create/upload needs manual test; Quilt/Bedrock/Terraria/universal are experimental if Daemon factories missing; CORS may force BMCLAPI for loader lists.

