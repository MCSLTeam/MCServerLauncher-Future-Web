# MCServerLauncher-Future-Web Guide

Guide for agents working on the MCServerLauncher-Future-Web project.

## Project Overview

**MCServerLauncher-Future-Web** is the web-based client suite for MCServerLauncher-Future. It's a monorepo containing a web panel and a Tauri-based desktop application, both sharing common UI components and logic.

- **Repository**: MCServerLauncher-Future-Web
- **Architecture**: Monorepo (Turborepo)
- **Package Manager**: pnpm
- **License**: GPLv3
- **Team**: MCSLTeam
- **Copyright**: © 2022-2026 MCSLTeam
- **Codename**: CherryGrove
- **Version**: 0.1.0

## Essential Commands

```bash
# Install dependencies
pnpm install

# Web Panel Commands
pnpm web:dev              # Start both frontend and backend dev servers
pnpm web:dev:frontend     # Start only frontend dev server
pnpm web:dev:backend      # Start only backend dev server (Rust)
pnpm web:build            # Build web panel (frontend + backend)
pnpm web:build:docker     # Build Docker image
pnpm web:lint             # Lint web panel
pnpm web:fix              # Fix linting issues

# Tauri App Commands
pnpm app:dev              # Start Tauri app development
pnpm app:build            # Build Tauri app
pnpm app:lint             # Lint Tauri app
pnpm app:fix              # Fix linting issues

# Global Commands
pnpm build                # Build all packages
pnpm lint                 # Lint all packages
pnpm fix                  # Fix all linting issues
pnpm test                 # Test all packages

# Package-specific Commands
pnpm ui:lint              # Lint UI package
pnpm shared:lint          # Lint shared package
```

## Project Structure

```
MCServerLauncher-Future-Web/
├── apps/
│   ├── web/                 # Web Panel (Next.js + shadcn/ui + Rust Actix-web)
│   │   ├── app/             # Next.js App Router frontend
│   │   ├── components/      # React / shadcn/ui components
│   │   ├── src/             # Rust backend source
│   │   ├── dist/            # Static export for release embed
│   │   ├── Cargo.toml       # Rust dependencies
│   │   ├── package.json     # Frontend dependencies
│   │   └── Dockerfile       # Docker build config
│   │
│   └── app/                 # Tauri Desktop App (Vue 3 + Tauri)
│       ├── src/             # Vue 3 frontend source
│       │   ├── App.vue      # Root component
│       │   ├── index.ts     # Entry point
│       │   └── components/  # App-specific components
│       ├── src-tauri/       # Tauri backend (Rust)
│       │   ├── src/         # Rust source
│       │   ├── Cargo.toml   # Rust dependencies
│       │   ├── tauri.conf.json        # Tauri config
│       │   └── tauri.macos.conf.json  # macOS-specific config
│       └── package.json     # Frontend dependencies
│
├── packages/
│   ├── configs/             # Shared configuration
│   │   ├── eslint/          # ESLint configs
│   │   ├── prettier/        # Prettier configs
│   │   └── ts/              # TypeScript configs
│   │
│   ├── locales/             # Internationalization (git submodule)
│   │   ├── locales/         # Translation files
│   │   ├── eula/            # EULA translations
│   │   └── scripts/         # Locale formatting scripts
│   │
│   ├── shared/              # Shared code and pages
│   │   └── src/
│   │       ├── assets/      # Shared assets
│   │       ├── components/  # Shared components
│   │       ├── layouts/     # Shared layouts
│   │       └── utils/       # Shared utilities
│   │
│   └── ui/                  # UI component library
│       └── src/             # UI components for MCSL Future
│
├── turbo.json               # Turborepo configuration
├── package.json             # Root package.json
├── pnpm-lock.yaml                 # pnpm lockfile
├── Cargo.toml               # Rust workspace config
└── Cargo.lock               # Rust lockfile
```

## Technology Stack

### Frontend

**Web panel (`apps/web`)**:

- **Framework**: Next.js 16 (App Router) + React 19
- **UI**: shadcn/ui + Tailwind CSS v4 + framer-motion（对齐 ME Frp v6）
- **Language**: TypeScript 5.9+
- **Build**: `next build` static export → `dist/` (embedded by Rust in release)

**Tauri app (`apps/app`)**:

- **Framework**: Tauri 2.10+
- **Frontend**: shared Next.js console from `apps/web`
- **Development URL**: `http://localhost:3000/`
- **Release frontend**: `apps/web/dist`

### Backend

**Web Panel (Rust)**:

- **Framework**: Actix-web 4
- **Edition**: Rust 2024
- **Logging**: env_logger 0.11+, log 0.4+
- **Serialization**: serde 1.0+, serde_json 1.0+
- **Utilities**: regex 1.12+, lazy_static 1.5+, tokio 1.49+
- **Security**: sha2 0.10+, hex 0.4+, rand 0.10+
- **Static Files**: include_dir 0.7+, mime_guess 2.0+

**Tauri App (Rust)**:

- **Framework**: Tauri 2.10+
- **Edition**: Rust 2024
- **Plugins**: notification, opener, os, process

### Build & Development

- **Monorepo**: Turborepo 2.8+
- **Package Manager**: pnpm 11+
- **Linting**: ESLint 10.0+, Prettier 3.8+
- **Type Checking**: vue-tsc 3.2+, TypeScript 6.0+

## Code Organization

### Web Panel (`apps/web`)

**Backend (Rust)**:

- `main.rs`: Actix-web server setup, static file serving, API routing
- `api.rs`: API endpoint handlers (~14KB, main business logic)
- `user.rs`: User management, authentication (~9KB)
- `token.rs`: JWT token generation and validation (~12KB)
- `config.rs`: Configuration loading and management
- `utils.rs`: Utility functions

**Frontend (Next.js + shadcn/ui)**:

- App Router under `apps/web/app`
- UI via shadcn/ui (`components/ui`) + Tailwind v4（not HeroUI / `@repo/ui`）
- Static export to `dist/` for Actix release embedding

### Tauri App (`apps/app`)

**Frontend**:

- Uses the same Next.js console as the Web panel
- No separate Vue/RsBuild frontend is retained

**Backend (Rust)**:

- Tauri 2.10+ with plugins for notifications, OS info, process management
- Platform-specific configurations (Windows, macOS)

### Shared Packages

**`@repo/configs`**:

- ESLint, Prettier, TypeScript configurations
- Shared across all packages for consistency

**`@repo/locales`** (Git Submodule):

- Translation files for 6 languages
- EULA translations
- Formatting scripts for locale files

**`@repo/shared`**:

- Common components used by both web and app
- Shared layouts and page templates
- Utility functions
- Assets (icons, images, styles)

**`@repo/ui`**:

- UI component library specific to MCSL Future
- Reusable components with consistent styling

## Naming Conventions & Code Style

### TypeScript/Vue

- Use PascalCase for components and classes
- Use camelCase for variables, functions, and methods
- Use kebab-case for file names (e.g., `user-profile.vue`)
- Use UPPER_SNAKE_CASE for constants
- Prefer Composition API over Options API in Vue 3
- Use `<script setup>` syntax for Vue components

### Rust

- Use snake_case for functions, variables, and modules
- Use PascalCase for types, structs, enums, and traits
- Use SCREAMING_SNAKE_CASE for constants
- Follow Rust 2024 edition conventions
- Use `#[derive]` for common traits

### File Organization

- Components: `ComponentName.vue`
- Composables: `useFeatureName.ts`
- Utilities: `feature-name.ts`
- Types: `types.ts` or `feature-name.types.ts`

## Key Concepts

- **Monorepo Architecture**: Uses Turborepo for efficient builds and caching across packages
- **Workspace Dependencies**: Packages reference each other via `workspace:*` protocol
- **Dual Backend**: Web panel uses Rust Actix-web, Tauri app uses Tauri framework
- **Shared Frontend**: Both apps share Vue 3 components and utilities
- **i18n Support**: 6 languages supported via git submodule
- **RsBuild**: Modern build tool replacing Webpack/Vite for faster builds
- **Bun Package Manager**: Recently migrated from pnpm for faster installs
- **Docker Support**: Web panel can be containerized for deployment
- **Cross-Platform**: Tauri app supports Windows, macOS, and Linux

## Development Workflow

### Starting Development

1. **Install dependencies**: `pnpm install`
2. **Start web panel**: `pnpm web:dev` (starts both frontend and backend)
3. **Start Tauri app**: `pnpm app:dev`

### Building for Production

1. **Web panel**: `pnpm web:build` (builds frontend, then Rust backend)
2. **Tauri app**: `pnpm app:build` (creates platform-specific installers)
3. **Docker**: `pnpm web:build:docker` (builds Docker image)

### Linting and Formatting

- Run `pnpm lint` to check all packages
- Run `pnpm fix` to auto-fix issues
- ESLint and Prettier configs are shared via `@repo/configs`

## Turborepo Configuration

The `turbo.json` file defines:

- **Build pipeline**: Dependencies between packages
- **Caching**: Outputs cached for faster rebuilds
- **Environment passthrough**: `CARGO_HOME`, `RUSTUP_HOME`, `RUSTUP_TOOLCHAIN`
- **Persistent tasks**: Dev servers don't cache

## Common Issues

### Package Manager Migration

- Project uses pnpm workspaces
- Use `pnpm install` instead of `pnpm install`
- Lockfile is `pnpm-lock.yaml`

### Git Submodule (locales)

- Locales are in a git submodule
- Run `git submodule update --init --recursive` after cloning
- Update submodule: `git submodule update --remote packages/locales`

### Rust Environment

- Ensure Rust toolchain is installed: `rustup default stable`
- Tauri requires system dependencies (see Tauri docs for platform-specific requirements)
- Web backend uses Rust 2024 edition

### CSS Theme Issues

- Recent fix for CSS "flashbang" (theme loading issues)
- UI loading order optimized: load UI before mounting app

## Git & Workflow Notes

- Main branch is `master`
- Ensure all tests pass and code compiles before committing
- Run `pnpm lint` before committing
- Run `pnpm test` to verify type checking
- Follow monorepo structure: place code in appropriate app or package
- Update locale submodule when adding new translation keys

## Daemon & Tauri (current)

- Web console talks to MCSL Daemon via browser WebSocket (`apps/web/lib/daemon`, `features/nodes/daemon-provider.tsx`).
- Tauri desktop shell hosts the same Next.js console (`devUrl` :3000 / `frontendDist` web dist), not dual Vue business UI.

## Recent Development Activity

- **Package Manager Migration**: Package manager migrated back to pnpm
- **Theme Fixes**: Resolved CSS flashbang issues (e26d305)
- **UI Loading**: Improved initialization order (526b999)
- **Features**: Instance creation, file upload, user center (ad7b45a, e56ee99, ecd5891)
- **Dependencies**: Regular updates and version bumps (a0c6075, 9554ca8)
- **Build System**: Unified web dev task with Rust env passthrough (d429694)

## Testing

- **Type Checking**: `vue-tsc --noEmit` for TypeScript validation
- **Rust Tests**: `cargo test` for backend tests
- **Linting**: ESLint for code quality
- **Manual Testing**: Start dev servers and test in browser

## Deployment

### Web Panel

- **Docker**: Use `pnpm web:build:docker` to build image
- **Linux Setup**: Installation script available at `setup_en.sh`
- **Manual**: Build with `pnpm web:build`, deploy Rust binary + frontend dist

### Tauri App

- **Platform-specific**: `pnpm app:build` creates installers
- **Windows**: `.exe` installer
- **macOS**: `.dmg` or `.app` bundle
- **Linux**: `.AppImage` or `.deb`

## Related Projects

- **Daemon**: [MCServerLauncher-Future](https://github.com/MCSLTeam/MCServerLauncher-Future) - .NET daemon
- **Rust Daemon**: [mcsl-daemon-rs](https://github.com/MCSLTeam/mcsl-daemon-rs/) - Experimental Rust daemon
- **WPF Launcher**: Windows-specific .NET client

## Contact & Contribution

- **Email**: <services@mcsl.com.cn>
- **QQ Group 1**: 733951376
- **QQ Group 2**: 819067131
- **Issues**: [GitHub Issues](https://github.com/MCSLTeam/MCServerLauncher-Future/issues/new/choose)
- **Pull Requests**: [GitHub PRs](https://github.com/MCSLTeam/MCServerLauncher-Future/compare)
- **Internationalization**: [Weblate](https://translate.mcsl.com.cn/engage/mcsl-future/)

## References

- [Vue 3 Documentation](https://vuejs.org/)
- [Tauri Documentation](https://tauri.app/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Rust Documentation](https://www.rust-lang.org/learn)
- [RsBuild Documentation](https://rsbuild.dev/)
- [Actix-web Documentation](https://actix.rs/)
- [pnpm Documentation](https://pnpm.io/)
