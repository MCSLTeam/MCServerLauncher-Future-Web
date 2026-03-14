# MCServerLauncher-Future-Web/apps/app Guide

Guide for agents working on the MCServerLauncher-Future-Web Tauri application.

## Project Overview

**mcsl-future-tauri** is the Tauri-based desktop application wrapper for the MCServerLauncher-Future-Web project. It packages the web frontend into a native desktop application.

- **Repository**: MCServerLauncher-Future-Web
- **Language**: Rust, TypeScript, Vue 3
- **Framework**: Tauri
- **Architecture**: Monorepo App (Turborepo)

## Essential Commands

```bash
# Start Tauri app development server
pnpm run app:dev

# Build Tauri app
pnpm run app:build

# Lint Tauri app
pnpm run app:lint

# Test Tauri app
pnpm run app:test
```

## Project Structure

```
apps/app/
├── src-tauri/       # Tauri Rust backend code
├── src/             # Frontend code specific to the desktop app (if any)
└── package.json     # App-specific dependencies and scripts
```

## Key Concepts

- **Tauri**: A framework for building tiny, blazingly fast binaries for all major desktop platforms.
- **Monorepo Integration**: This app relies on shared packages from the `packages/` directory and potentially the `apps/web` frontend.

## Git & Workflow Notes

- Ensure all tests pass and code builds successfully before committing.
- Follow the monorepo structure and use `pnpm` for managing dependencies.

## References

- [Tauri Documentation](https://tauri.app/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Rust Documentation](https://www.rust-lang.org/learn)
