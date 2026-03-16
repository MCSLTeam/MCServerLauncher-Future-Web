# MCServerLauncher-Future-Web/packages/shared Guide

Guide for agents working on the MCServerLauncher-Future-Web shared package.

## Project Overview

**shared** is a shared package within the MCServerLauncher-Future-Web monorepo. It contains shared utilities, types, and constants used across different applications (like the web server and desktop app).

- **Repository**: MCServerLauncher-Future-Web
- **Language**: Vue3, TypeScript
- **Architecture**: Monorepo Package (Turborepo)

## Essential Commands

```bash
# Run all below in the project root
# Lint the shared package
pnpm --filter @repo/shared run lint

# Auto-fix formatting and lint issues
pnpm --filter @repo/shared run fix

# Type-check and tests for the shared package
pnpm --filter @repo/shared run test
```

## Project Structure

```
packages/shared/
├── src/             # Source code for shared utilities, types, etc.
├── rsbuild.config.ts # Rsbuild configuration
├── tsconfig.json    # TypeScript configuration
└── package.json     # Package-specific dependencies and scripts
```

## Key Concepts

- **Shared Code**: This package is designed to be imported by other apps and packages within the monorepo to avoid code duplication.
- **TypeScript**: Strongly typed definitions should be provided for all shared code.

## Git & Workflow Notes

- Ensure all tests pass and code builds successfully before committing.
- Follow the monorepo structure and use `pnpm` for managing dependencies.
- Changes here may affect multiple applications, so test thoroughly.

## References

- [Vue 3 Documentation](https://vuejs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [RsBuild Documentation](https://rsbuild.dev/)
