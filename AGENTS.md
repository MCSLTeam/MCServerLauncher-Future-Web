# MCServerLauncher-Future-Web Guide

Guide for AI agents working on the MCServerLauncher-Future-Web project.

## Project Overview

**MCServerLauncher-Future-Web** is the web-based client for the MCServerLauncher-Future project. It is a monorepo
containing a web server and a Tauri-based desktop application.

- **Repository**: MCServerLauncher-Future-Web
- **Architecture**: Monorepo (Turborepo)
- **Package Manager**: pnpm

## Subprojects

- **MCSL Future Web**: A web panel acting as a client for MCSL Future daemons.
- **MCSL Future Tauri**: A local client which can connect to both web panel and daemons.

## Monorepo Structure

The project is organized as a monorepo using Turborepo and pnpm workspaces.

- `packages/`: Shared packages and libraries.
    - `configs/`: Contains common plugin configs.
    - `ui/`: The ui components for MCSL Future Web.
    - `locales/`: A git submodule containing i18n translations.
    - `shared/`: Common codes and pages for both web server and desktop app.
- `apps/`: Contains the main applications.
    - `app/`: The desktop app and unique code of MCSL Future Tauri.
    - `web/`: The web server and unique code of MCSL Future Web.

## Essential Commands

The root `package.json` provides scripts to manage the monorepo using Turborepo.

```bash
# Install dependencies
pnpm install

# Web Frontend Commands
pnpm run web:dev    # Start web frontend development server
pnpm run web:build  # Build web frontend
pnpm run web:lint   # Lint web frontend
pnpm run web:test   # Test web frontend

# Tauri App Commands
pnpm run app:dev    # Start Tauri app development server
pnpm run app:build  # Build Tauri app
pnpm run app:lint   # Lint Tauri app
pnpm run app:test   # Test Tauri app

# Global Commands
pnpm run build      # Build all packages
pnpm run lint       # Lint all packages
pnpm run test       # Test all packages
```

## Technology Stack

- **Web**:
    - Frontend: Vue 3, TypeScript, RsBuild
    - Backend: Rust Actix Web
- **App**: Tauri
    - Frontend: Vue 3, TypeScript, RsBuild
    - Backend: Tauri
- **Build Tool**: Turborepo
- **Package Manager**: pnpm

## AI Agents Contribution

本项目的开发与维护过程中，得到了 AI 代理（如 Cline 等）的协助。
AI 代理主要参与了以下工作：

- 代码重构与优化
- 国际化 (i18n) 支持
- Bug 修复与逻辑完善
- 跨平台兼容性处理

## Git & Workflow Notes

- Ensure all tests pass and code builds successfully before committing.
- Follow the monorepo structure and place code in the appropriate app or package.

## References

- [Vue 3 Documentation](https://vuejs.org/)
- [Tauri Documentation](https://tauri.app/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Rust Documentation](https://www.rust-lang.org/learn)
- [RsBuild Documentation](https://rsbuild.dev/)
