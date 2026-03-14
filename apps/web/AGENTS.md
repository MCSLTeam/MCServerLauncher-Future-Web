# MCServerLauncher-Future-Web/apps/web Guide

Guide for agents working on the MCServerLauncher-Future-Web frontend application.

## Project Overview

**mcsl-future-web** is the web frontend application for the MCServerLauncher-Future project. It provides the user interface for managing Minecraft servers.

- **Repository**: MCServerLauncher-Future-Web
- **Language**: TypeScript, Vue 3
- **Framework**: Vue 3, Vite
- **Architecture**: Monorepo App (Turborepo)

## Essential Commands

```bash
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
├── src/             # Vue 3 source code (components, views, assets)
├── public/          # Static assets
├── index.html       # Entry HTML file
├── vite.config.ts   # Vite configuration
└── package.json     # App-specific dependencies and scripts
```

## Key Concepts

- **Vue 3**: The core frontend framework used for building the user interface.
- **Vite**: The build tool and development server.
- **Monorepo Integration**: This app relies on shared packages from the `packages/` directory.

## Git & Workflow Notes

- Ensure all tests pass and code builds successfully before committing.
- Follow the monorepo structure and use `pnpm` for managing dependencies.

## References

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
