# MCServerLauncher-Future-Web/apps/web Guide

Guide for agents working on the MCServerLauncher-Future-Web frontend application.

## Project Overview

**mcsl-future-web** is the web panel server application for the MCServerLauncher-Future project. It provides the user interface for managing Minecraft servers.

- **Repository**: MCServerLauncher-Future-Web
- **Language**: TypeScript, Rust
- **Framework**: Vue 3, RsBuild, Actix Web
- **Architecture**: Monorepo App (Turborepo)

## Essential Commands

```bash
# Run all below in the project root
# Start web frontend development server
pnpm run web:dev

# Build web frontend
pnpm run web:build

# Lint web frontend
pnpm run web:lint

# Test web frontend
pnpm run web:test
```

## Project Structure

```
apps/web/
├── src-frontend/     # Vue 3 source code (components, views, assets)
├── src/              # Rust server source code
├── public/           # Static assets
├── rsbuild.config.ts # Rsbuild configuration
└── package.json      # App-specific dependencies and scripts
```

## Key Concepts

- **Vue 3**: The core frontend framework used for building the user interface.
- **Actix Web**: The core rust server framework used for building restful apis and hosting static web files.
- **RsBuild**: The build tool and development server.
- **Monorepo Integration**: This app relies on shared packages from the `packages/` directory.

## Git & Workflow Notes

- Ensure all tests pass and code builds successfully before committing.
- Follow the monorepo structure and use `pnpm` for managing dependencies.

## References

- [Vue 3 Documentation](https://vuejs.org/)
- [Rust Documentation](https://www.rust-lang.org/learn)
- [RsBuild Documentation](https://rsbuild.dev/)
