# MCServerLauncher-Future-Web/packages/configs Guide

Guide for agents working on the MCServerLauncher-Future-Web configs package.

## Project Overview

**configs** is a shared package within the MCServerLauncher-Future-Web monorepo. It contains shared configuration files (like ESLint, Prettier, TypeScript configs) used across the entire monorepo to ensure consistency.

- **Repository**: MCServerLauncher-Future-Web
- **Language**: JSON, JavaScript/TypeScript
- **Architecture**: Monorepo Package (Turborepo)

## Essential Commands

```bash
# This package typically doesn't have build/test scripts of its own,
# but it is used by other packages when they run their lint/build scripts.
```

## Project Structure

```
packages/configs/
├── eslint/          # Shared ESLint configurations
├── prettier/        # Shared Prettier configurations
├── tsconfig/        # Shared TypeScript configurations
└── package.json     # Package-specific dependencies
```

## Key Concepts

- **Shared Configuration**: Centralizes tooling configuration to maintain a consistent code style and build process across all apps and packages.
- **Extensibility**: Other packages extend these base configurations in their own `tsconfig.json` or `.eslintrc` files.

## Git & Workflow Notes

- Changes to these configurations will affect the linting and building of the entire monorepo.
- Ensure that changes do not break existing code in other packages.
- Follow the monorepo structure and use `pnpm` for managing dependencies.

## References

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
