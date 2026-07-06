# Sprint 2 Walkthrough — Tasks 2.1 & 2.2 Complete

We have successfully implemented and verified **Task 2.1 — Clerk Authentication** and **Task 2.2 — Business (Tenant) Foundation** for both the NestJS API and the Next.js Web app.

## Changes Made

### Frontend (`apps/web`)

- Wrapped Next.js application root in `ClerkProvider` ([layout.tsx](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/apps/web/src/app/layout.tsx)).
- Added protected route middleware checking for public paths ([middleware.ts](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/apps/web/src/middleware.ts)).
- Scaffolded sign-in and sign-up page paths dynamically integrating Clerk forms ([sign-in/page.tsx](<file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/apps/web/src/app/(auth)/sign-in/%5B%5B...sign-in%5D%5D/page.tsx>), [sign-up/page.tsx](<file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/apps/web/src/app/(auth)/sign-up/%5B%5B...sign-up%5D%5D/page.tsx>)).

### Backend (`apps/api`)

#### Task 2.1 — Authentication

- Created JWT verification guard (`ClerkAuthGuard`) integrating Clerk's verification client with support for mock signatures under test environments ([clerk-auth.guard.ts](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/apps/api/src/common/guards/clerk-auth.guard.ts)).
- Created request param decorator to extract the parsed Clerk identity ([user.decorator.ts](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/apps/api/src/common/decorators/user.decorator.ts)).
- Implemented protected `GET /api/v1/auth/me` endpoint in backend returning authenticated identity attributes ([auth.controller.ts](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/apps/api/src/modules/auth/auth.controller.ts)).

#### Task 2.2 — Business Foundation

- Updated database schema to define the core relational structure for `Tenant`, `User`, and `Employee` tables ([schema.prisma](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/prisma/schema.prisma)).
- Generated and successfully executed migration `business-foundation` against the PostgreSQL container.
- Wired global `PrismaService` and `PrismaModule` to manage PostgreSQL connection lifecycles within NestJS dependency containers ([prisma.service.ts](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/apps/api/src/prisma/prisma.service.ts), [prisma.module.ts](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/apps/api/src/prisma/prisma.module.ts)).
- Created `TenantContextGuard` to resolve/lazy-sync the Clerk user metadata to the local PostgreSQL database, query the user's active `Employee` context, and inject the mapped tenant information to the request payload ([tenant-context.guard.ts](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/apps/api/src/common/guards/tenant-context.guard.ts)).
- Created parameter decorator `TenantContext` to fetch active tenant configurations in module controller endpoints ([tenant-context.decorator.ts](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/apps/api/src/common/decorators/tenant-context.decorator.ts)).
- Implemented businesses domain controller and service supporting `POST /api/v1/businesses` to instantiate new tenants, associate the creating user as `OWNER` of the tenant, validate unique slugs, and enforce the single-business registration limit for Sprint 2 ([businesses.controller.ts](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/apps/api/src/modules/businesses/businesses.controller.ts), [businesses.service.ts](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/apps/api/src/modules/businesses/businesses.service.ts)).
- Refactored `GET /api/v1/auth/me` to query database-backed context values resolved via the tenant guards ([auth.controller.ts](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/apps/api/src/modules/auth/auth.controller.ts)).

---

## Security Refinements (Task 2.1 Patch)

Following a production security audit, the mock authentication flow was hardened with the following strict environment rules:

### 1. Production Authentication Flow

- When `NODE_ENV=production`, Clerk JWT validation is **strictly mandatory**.
- No mock credentials bypass or fallback is allowed under any circumstance.
- The guard demands an explicit `CLERK_SECRET_KEY` in environment variables. If absent, the guard fails with a `401 Unauthorized` exception to protect downstream systems.

### 2. Development Mock Authentication

- Mock authentication bypass is only enabled if:
  1. The environment is **not** production (`NODE_ENV !== 'production'`).
  2. The explicit environment flag `ENABLE_MOCK_AUTH=true` is set.
  3. The bearer token starts with `"mock-"`.
- If `ENABLE_MOCK_AUTH` is missing or set to `false`, the backend fails back to real Clerk JWKS validation.

### 3. Test Authentication

- Unit tests explicitly verify the separation of mock and production states.
- Removed all inline fallback secrets (such as `"sk_test_mock_secret"`) to force secure configuration from environment variables.

---

## Verification Results

### 1. Automated Unit/Integration Tests

Ran NestJS test pipeline successfully:

```bash
pnpm --filter api run test
```

- `PASS src/app.controller.spec.ts`
- `PASS src/common/guards/clerk-auth.guard.spec.ts` (asserts valid tokens unlock, invalid and missing credentials fail, production rejects mock tokens, development accepts mock tokens only when ENABLE_MOCK_AUTH=true)
- `PASS src/modules/auth/auth.controller.spec.ts` (asserts `/auth/me` resolves valid JWT payloads)
- `PASS src/modules/businesses/businesses.service.spec.ts` (asserts businesses create cleanly, unique slugs resolve, single-business restrictions enforce, and missing user entries block creation)
- `PASS src/modules/businesses/businesses.controller.spec.ts` (asserts payload validations and bad requests reject appropriately)

- **Result**: 5 passed, 5 total; 22 passed, 22 total.

### 2. Workspace Monorepo Build checks

Ran complete Turborepo static validation successfully:

```bash
pnpm exec turbo run build lint typecheck
```

- **Result**: All 16 build/lint/typecheck steps across 8 packages compiled and validated with zero errors.
