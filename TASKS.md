# MCServerLauncher-Future-Web Tasks

Task tracking for the MCServerLauncher-Future-Web project. This document organizes pending work, technical debt, and improvement opportunities for the web panel and Tauri app.

**Last Updated**: 2026-05-03

---

## 🔴 High Priority

### Package Manager Migration Follow-up

- [ ] **Verify Bun compatibility across all packages**
  - Recent migration from pnpm to Bun (870702a)
  - Test all build, dev, and test scripts with Bun
  - Verify lockfile integrity and dependency resolution
  - Check for any pnpm-specific scripts or configurations that need updating

- [ ] **Update CI/CD pipelines for Bun**
  - Update GitHub Actions workflows to use Bun
  - Update Docker build process if needed
  - Verify deployment scripts work with Bun

### Theme and UI Stability

- [ ] **Prevent CSS flashbang on load**
  - Recent fix applied (e26d305)
  - Verify fix works across all browsers
  - Test with different theme preferences (light/dark/system)
  - Ensure theme persistence across page reloads

- [ ] **UI initialization order**
  - Recent improvement (526b999)
  - Verify UI loads before app mounting in all scenarios
  - Test with slow network conditions
  - Ensure no FOUC (Flash of Unstyled Content)

### Critical Features

- [ ] **Complete instance creation flow**
  - Feature added (ad7b45a)
  - Test end-to-end instance creation
  - Verify error handling and validation
  - Ensure proper daemon communication

- [ ] **File upload robustness**
  - Feature added (e56ee99)
  - Test large file uploads
  - Verify chunking and progress reporting
  - Handle network interruptions gracefully

---

## 🟡 Medium Priority

### Testing & Quality

- [ ] **Add comprehensive test coverage**
  - Current: Only type checking with vue-tsc --noEmit
  - Add unit tests for Vue components
  - Add integration tests for API endpoints
  - Add E2E tests for critical user flows
  - Set up test coverage reporting

- [ ] **Rust backend testing**
  - Add unit tests for api.rs (~14KB, needs coverage)
  - Add tests for user.rs authentication logic
  - Add tests for token.rs JWT handling
  - Add integration tests for Actix-web routes

- [ ] **Type safety improvements**
  - Audit for any types in TypeScript
  - Add stricter TypeScript compiler options
  - Ensure all API responses are properly typed
  - Add runtime validation with Yup schemas

### Performance Optimization

- [ ] **Frontend bundle optimization**
  - Analyze bundle size with RsBuild
  - Implement code splitting for routes
  - Lazy load heavy components
  - Optimize asset loading (images, fonts)

- [ ] **Backend performance**
  - Profile Rust backend with benchmarks
  - Optimize database queries (if applicable)
  - Implement caching strategies
  - Add performance monitoring

- [ ] **Turborepo optimization**
  - Review cache hit rates
  - Optimize task dependencies
  - Reduce unnecessary rebuilds
  - Profile build times

### Feature Development

- [ ] **User center enhancements**
  - Feature added (ecd5891)
  - Add profile editing
  - Add password change functionality
  - Add session management
  - Add activity logs

- [ ] **Instance management improvements**
  - Add bulk operations (start/stop multiple instances)
  - Add instance templates
  - Add instance cloning
  - Add instance import/export

- [ ] **Real-time updates**
  - Implement WebSocket connection to daemon
  - Add real-time instance status updates
  - Add real-time console output streaming
  - Add real-time notifications

### Internationalization

- [ ] **Locale submodule management**
  - Document submodule update process
  - Add CI check for submodule sync
  - Add script to validate translation completeness
  - Add fallback handling for missing translations

- [ ] **Translation coverage**
  - Audit all UI text for i18n coverage
  - Ensure all 6 languages are complete
  - Add context comments for translators
  - Test RTL language support (if applicable)

---

## 🟢 Low Priority / Future Enhancements

### Developer Experience

- [ ] **Improve monorepo DX**
  - Add workspace-level scripts for common tasks
  - Improve error messages in build failures
  - Add pre-commit hooks for linting
  - Add commit message linting

- [ ] **Documentation improvements**
  - Add API documentation (OpenAPI/Swagger)
  - Add component documentation (Storybook?)
  - Add architecture diagrams
  - Add troubleshooting guide

- [ ] **Development tooling**
  - Add hot module replacement for Rust backend
  - Improve dev server startup time
  - Add debug configurations for IDEs
  - Add development Docker Compose setup

### Code Quality

- [ ] **Refactoring opportunities**
  - Extract common patterns in api.rs (14KB file)
  - Split large components into smaller ones
  - Improve error handling consistency
  - Standardize API response formats

- [ ] **Dependency management**
  - Audit and update outdated dependencies
  - Remove unused dependencies
  - Consolidate duplicate dependencies across packages
  - Document dependency choices

- [ ] **Security hardening**
  - Add security headers in Rust backend
  - Implement rate limiting
  - Add CSRF protection
  - Audit for XSS vulnerabilities
  - Add security scanning to CI

### Tauri App Specific

- [ ] **Platform-specific features**
  - Add native notifications
  - Add system tray integration
  - Add auto-update functionality
  - Add deep linking support

- [ ] **App optimization**
  - Reduce app bundle size
  - Optimize startup time
  - Implement app state persistence
  - Add crash reporting

### Web Panel Specific

- [ ] **Docker improvements**
  - Optimize Docker image size
  - Add multi-stage build
  - Add health checks
  - Add Docker Compose for development

- [ ] **Deployment automation**
  - Add automated deployment scripts
  - Add rollback mechanism
  - Add deployment health checks
  - Add blue-green deployment support

---

## ✅ Recently Completed

### Package Management
- ✅ Migrated from pnpm to Bun (870702a)
- ✅ Updated dependencies (a0c6075)
- ✅ Fixed dependency issues (9554ca8)

### UI/UX Improvements
- ✅ Fixed CSS flashbang on theme load (e26d305)
- ✅ Improved UI loading order (526b999)

### Features
- ✅ Implemented instance creation (ad7b45a)
- ✅ Implemented file upload (e56ee99)
- ✅ Implemented user center (ecd5891)

### Build System
- ✅ Added unified web dev task (d429694)
- ✅ Added Rust env passthrough (d429694)

### Documentation
- ✅ Updated AGENTS.md guide (7ac2653, 73f6d0c)
- ✅ Updated locale submodule (26a7fd8)

---

## 📊 Project Metrics

### Build Status
- **Monorepo**: Turborepo 2.8+
- **Package Manager**: Bun 1.3+
- **Apps**: 2 (web panel, Tauri app)
- **Packages**: 4 (configs, locales, shared, ui)

### Technology Stack
- **Frontend**: Vue 3.5+, TypeScript 5.9+, RsBuild 1.7+
- **Backend (Web)**: Rust 2024, Actix-web 4
- **Backend (App)**: Tauri 2.10+
- **Languages Supported**: 6

### Code Statistics
- **Rust Backend Files**: 6 (main.rs, api.rs, user.rs, token.rs, config.rs, utils.rs)
- **Largest File**: api.rs (~14KB)
- **Workspace Packages**: 4 shared packages

---

## 🎯 Recommended Focus Areas

### Q2 2026 Priorities

1. **Stabilization Sprint**
   - Complete package manager migration verification
   - Fix any remaining theme/UI issues
   - Add comprehensive test coverage
   - Target: Zero critical bugs

2. **Testing Infrastructure**
   - Set up unit testing for Vue components
   - Add Rust backend tests
   - Implement E2E testing
   - Measure and improve coverage

3. **Feature Completion**
   - Polish instance creation flow
   - Enhance file upload with better UX
   - Complete user center functionality
   - Add real-time updates via WebSocket

4. **Performance & Optimization**
   - Optimize frontend bundle size
   - Profile and optimize Rust backend
   - Improve Turborepo cache efficiency
   - Measure and improve load times

---

## 📝 Notes

### Architecture Decisions
- **Monorepo**: Turborepo chosen for efficient builds and caching
- **Bun**: Recently migrated from pnpm for faster installs and better DX
- **RsBuild**: Modern build tool for faster builds than Webpack/Vite
- **Rust Backend**: Actix-web for web panel, Tauri for desktop app
- **Shared Packages**: Maximize code reuse between web and app

### Development Workflow
- **Dev Servers**: Frontend and backend run separately, can be started together
- **Hot Reload**: Frontend has HMR, backend requires restart
- **Type Checking**: vue-tsc for TypeScript, cargo check for Rust
- **Linting**: ESLint + Prettier for frontend, cargo clippy for Rust

### Known Limitations
- **Locales**: Git submodule requires manual updates
- **Testing**: Limited test coverage currently
- **Documentation**: API documentation needs improvement
- **Monitoring**: No production monitoring/observability yet

---

## 🔗 Related Documentation

- [AGENTS.md](AGENTS.md) - Development guide for agents
- [README.md](README.md) - Project overview and setup
- [README_ZH.md](README_ZH.md) - Chinese documentation
- [turbo.json](turbo.json) - Turborepo configuration
- [Main Project TASKS.md](../MCServerLauncher-Future/TASKS.md) - Daemon and WPF tasks
