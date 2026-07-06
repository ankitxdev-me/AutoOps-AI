# Implementation Plan - Sprint 1: Core Workspace Setup (Revised)

This plan details the step-by-step setup of the foundational repository infrastructure for AutoOps AI. Sprint 1 is strictly **infrastructure-only** and does not contain business modules, database entities, or UI dashboards.

All tasks use **pnpm** and **Turborepo** to structure the workspace.

---

## Task 1 — Workspace Initialization

- **Purpose**: Set up the root directory as a pnpm workspace and configure Turborepo pipelines.
- **Deliverables**:
  - `package.json` at root (declares workspace packages, development scripts, and shared devDependencies).
  - `pnpm-workspace.yaml` (specifies `apps/*` and `packages/*` directories).
  - `turbo.json` (defines pipeline tasks for `build`, `lint`, `typecheck`, and `dev` with execution caching rules).
- **Dependencies**: None.
- **Verification Steps**:
  1. Verify pnpm workspace configuration structure.
  2. Confirm that Turborepo is installed as a development dependency at the root.
  3. Validate that running `pnpm exec turbo run build` yields a successful empty execution trace.
- **Acceptance Criteria**:
  - Global `turbo` tasks correctly target workspaces.
  - Command `pnpm install` completes successfully without workspace conflict warnings.
- **Estimated Time**: 2 hours.
- **Expected Git Commit Message**: `chore(repo): initialize pnpm workspaces and turborepo pipeline`

---

## Task 2 — Backend Initialization

- **Purpose**: Bootstrap a skeleton NestJS application within the `apps/api` workspace.
- **Deliverables**:
  - NestJS CLI scaffolding configuration under `apps/api/`.
  - Minimal `package.json` mapping workspace settings.
  - Entry module (`app.module.ts`) and main execution file (`main.ts`) serving a default hello response or health route.
- **Dependencies**: Task 1.
- **Verification Steps**:
  1. Navigate to the `apps/api` folder and execute `pnpm build`.
  2. Start the development server (`pnpm dev`) and confirm the API is listening on port `3001` (or local config port).
- **Acceptance Criteria**:
  - The application builds successfully using NestJS compiler CLI.
  - The server starts without runtime dependency conflicts.
- **Estimated Time**: 2 hours.
- **Expected Git Commit Message**: `feat(api): scaffold skeleton NestJS backend application`

---

## Task 3 — Frontend Initialization

- **Purpose**: Bootstrap a skeleton Next.js 15 application in the `apps/web` workspace using TypeScript.
- **Deliverables**:
  - Next.js scaffolding under `apps/web/`.
  - Tailwind CSS configurations and basic `globals.css` style layouts.
  - Minimal layout structure and clean landing page layout.
  - No dashboard features, lists, or custom controls.
- **Dependencies**: Task 1.
- **Verification Steps**:
  1. Navigate to `apps/web` and execute `pnpm build` to compile the Next.js static files.
  2. Verify that `pnpm dev` launches the development server on port `3000`.
- **Acceptance Criteria**:
  - Next.js compiles page pages without hydration or asset assembly errors.
- **Estimated Time**: 2 hours.
- **Expected Git Commit Message**: `feat(web): scaffold skeleton Next.js 15 frontend application`

---

## Task 4 — Docker Environment

- **Purpose**: Spin up local database and cache engines for developer environments.
- **Deliverables**:
  - Root-level `docker-compose.yml` declaring service containers for:
    - **PostgreSQL**: relational storage.
    - **Redis**: caching, sessions, and BullMQ task queues.
  - Dedicated credentials configuration via database environment files.
  - No application containers (API, Web) are defined yet.
- **Dependencies**: Task 1.
- **Verification Steps**:
  1. Execute `docker compose up -d` at the root directory.
  2. Verify that PostgreSQL and Redis containers show status `Up` on their designated ports (`5432`, `6379`).
- **Acceptance Criteria**:
  - Service processes successfully execute healthcheck statuses.
  - Database access credentials are read from config files rather than being hardcoded in compose configurations.
- **Estimated Time**: 2 hours.
- **Expected Git Commit Message**: `chore(infra): add docker-compose config for dev postgres and redis`

---

## Task 5 — Prisma Setup

- **Purpose**: Configure the Prisma ORM tool and verify connection to local PostgreSQL.
- **Deliverables**:
  - Prisma CLI tools added as dev dependencies in the `apps/api` app or workspace package.
  - `prisma/schema.prisma` file containing:
    - Datasource pointing to standard environment variables.
    - Client generator configuration.
    - Skeleton model structure (a simple dummy user model or configuration table) to verify system validation. No actual production database schemas are implemented yet.
  - `.env.example` mapping connection parameters.
- **Dependencies**: Task 4.
- **Verification Steps**:
  1. Execute `pnpm prisma validate` to confirm syntax formatting.
  2. Run `pnpm prisma db push` (or migration) and verify that the target tables are created in the local PostgreSQL instance.
- **Acceptance Criteria**:
  - Schema configuration matches compiler syntax requirements.
  - Connection to local PostgreSQL succeeds without credential errors.
- **Estimated Time**: 3 hours.
- **Expected Git Commit Message**: `chore(db): configure prisma orm and verify postgres database connection`

---

## Task 6 — Shared Packages Skeletons

- **Purpose**: Create package skeletons under `packages/` to house future domain logic.
- **Deliverables**:
  - Directory structures and minimal `package.json` workspace descriptors for:
    - **`packages/shared`**: Common types and schema files.
    - **`packages/ui`**: Components configuration.
    - **`packages/ai`**: LLM adapters skeleton.
    - **`packages/workflow-engine`**: Executable execution step skeletons.
    - **`packages/integrations`**: Third-party adapter stubs.
  - Each package contains only the configuration files (`tsconfig.json`, `package.json`) and minimal source files (e.g. an `index.ts` exporting an empty interface or mock constant) required to compile. No business logic.
- **Dependencies**: Task 1.
- **Verification Steps**:
  1. Navigate to each directory and run `pnpm build`.
  2. Verify that NestJS and Next.js applications can import these workspace packages successfully.
- **Acceptance Criteria**:
  - Compiler outputs files without module resolution errors.
- **Estimated Time**: 4 hours.
- **Expected Git Commit Message**: `chore(repo): add workspace packages skeletons and configurations`

---

## Task 7 — Development Tooling

- **Purpose**: Set up development tooling to enforce formatting, commit conventions, and linting rules.
- **Deliverables**:
  - Global ESLint and Prettier configs at the workspace root, extended into individual packages.
  - `.editorconfig` setting line endings, character sets, and spacing formats.
  - `.gitignore` excluding temporary build assets, packages metadata, node_modules, and environment credentials.
  - `.env.example` documenting all configuration keys.
  - **Commitlint**: Configured to reject non-conventional commit formats.
  - **Husky & lint-staged**: Pre-commit hook configurations to run format checks on code modifications.
- **Dependencies**: Task 1.
- **Verification Steps**:
  1. Run `pnpm run lint` and verify files comply with the lint rules.
  2. Attempt a mock git commit with an invalid commit title (e.g., `git commit -m "added stuff"`) and verify it is rejected.
  3. Validate that formatting errors are caught on file commits.
- **Acceptance Criteria**:
  - Code format violations prevent commits from completing.
  - Pre-commit hooks run within acceptable execution durations (<5s).
- **Estimated Time**: 4 hours.
- **Expected Git Commit Message**: `chore(tooling): configure eslint, prettier, husky, and commitlint`

---

## Task 8 — CI/CD Pipeline

- **Purpose**: Build a GitHub Actions CI pipeline to validate incoming commits and pull requests.
- **Deliverables**:
  - `.github/workflows/ci.yml` declaring an automated check pipeline on branches `main` and `develop`.
- **Dependencies**: Task 7.
- **Verification Steps**:
  1. Push a test branch to GitHub.
  2. Confirm that the pipeline triggers and successfully completes the execution steps.
- **Acceptance Criteria**:
  - The pipeline must execute four sequential steps:
    - **Install**: installs workspace dependencies using pnpm lock caching.
    - **Lint**: checks file formatting rules.
    - **Type Check**: compiles TypeScript types across workspaces.
    - **Build**: compiles the Next.js and NestJS applications.
- **Estimated Time**: 3 hours.
- **Expected Git Commit Message**: `chore(ci): configure github actions pipeline for validation`

---

## Task 9 — Final Verification

- **Purpose**: Perform a clean installation and verify that the monorepo builds and tests successfully.
- **Deliverables**:
  - Clean local test verification log.
- **Dependencies**: Tasks 1 through 8.
- **Verification Steps**:
  1. Clone the repository into a clean temporary workspace.
  2. Run `pnpm install`, launch PostgreSQL and Redis containers, run Prisma connection checks, and execute `pnpm run build`.
- **Acceptance Criteria**:
  - The entire repository compiles from scratch with zero warnings or configuration exceptions.
- **Estimated Time**: 2 hours.
- **Expected Git Commit Message**: `test(repo): run clean install and workspace build verification`
