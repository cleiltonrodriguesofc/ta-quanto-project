# Contributing to TaQuanto

## Git Workflow

Authentication and Code Quality are paramount. Please follow these guidelines:

### Branch Strategy
We follow a variation of Git Flow:

- **`main`**: Production-ready code. Deploys to production.
- **`development`**: Integration branch for features. Deploys to staging/dev.
- **Feature Branches**: `feature/<name>` (e.g., `feature/auth-google`)
- **Fix Branches**: `fix/<name>` (e.g., `fix/network-error`)
- **Chore Branches**: `chore/<name>` (e.g., `chore/ci-setup`)

### Pull Request Process
1. Create a branch from `development`.
2. Implement your changes.
3. Ensure all tests pass (`npm test`) and linting is clean (`npm run lint`).
4. Open a Pull Request (PR) to `development`.
5. PR requires approval before merging.

## Code Quality Standards
- **Linting**: We use ESLint. Zero warnings allowed.
- **Testing**: Jest is used for unit and integration tests.
- **Formatting**: Code must optionally be formatted with Prettier.
