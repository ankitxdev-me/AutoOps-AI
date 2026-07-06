# Implementation Plan — Sprint 2: Business Foundation

**Sprint**: Sprint 2 – Business Foundation  
**Status**: Ready to Begin  
**Depends on**: Sprint 1 (v0.1.0 — ✅ Complete)  
**Version Target**: v0.2.0  
**Branch**: `feat/sprint-2-business-foundation`

---

## Background

Sprint 1 established the monorepo workspace. Sprint 2 builds the **business foundation layer**:
authentication, tenant context resolution, and business entity management.

Per the ROADMAP.md, Sprint 2 objectives are:

> Clerk auth middleware → tenant context middleware → Business Settings API → Members Management → Dashboard shell.

Architecture rules enforced throughout:

- **Strict multi-tenancy**: every query filtered by resolved `tenantId`.
- **AI decides, Engine executes**: no direct AI-to-database operations.
- **Clerk is the identity provider** — the backend maps Clerk identities to internal Users and Employees.

---

## Open Questions

> [!IMPORTANT]
> **Clerk Setup**: Sprint 2 requires a Clerk application. You will need to:
>
> 1. Create a Clerk app at https://clerk.com and obtain your publishable + secret keys.
> 2. Add them to your `.env` file before starting the backend.
>    Do NOT commit real Clerk keys to git.

> [!NOTE]
> **shadcn/ui**: The architecture specifies shadcn/ui for the frontend. Sprint 2 will initialize it in `apps/web`. This requires a one-time CLI setup that needs approval per component.

---

## Proposed Changes

---

### Task 1 — Prisma Schema: Business Foundation Models

#### [MODIFY] [schema.prisma](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/prisma/schema.prisma)

Replace the placeholder `SchemaVerification` model with the real business foundation entities:

- `Tenant` — business account (id, name, slug, status, plan, createdAt, updatedAt, deletedAt)
- `User` — Clerk-mapped platform identity (id, clerkId, email, firstName, lastName, avatarUrl, status)
- `Employee` — user's membership within a tenant (id, tenantId, userId, title, status, isOwner, createdAt)
- `Department` — groups employees by function (id, tenantId, name)
- `Role` — tenant-scoped RBAC role (id, tenantId, name, isSystem)
- `Permission` — granular capability string (id, name, description)
- `RolePermission` — join table linking roles to permissions
- `EmployeeRole` — join table linking employees to roles
- `BusinessProfile` — structured onboarding result (id, tenantId, industry, status, data JSONB)
- `BusinessSettings` — tenant configuration (id, tenantId, timezone, locale, currency, settings JSONB)

Run: `pnpm exec prisma migrate dev --name business-foundation`

---

### Task 2 — NestJS: Clerk Guard & Tenant Middleware

#### [NEW] `apps/api/src/common/guards/clerk-auth.guard.ts`

- Validate the `Authorization: Bearer <token>` header using Clerk JWT verification.
- Reject unauthorized requests with `401 UNAUTHORIZED`.
- Attach verified Clerk user identity to the request object.

#### [NEW] `apps/api/src/common/middleware/tenant-context.middleware.ts`

- After Clerk verification, look up the internal `User` record by `clerkId`.
- Resolve the active `Employee` record and extract `tenantId`.
- Attach `{ userId, tenantId, employeeId, roles }` to `req.tenantContext`.
- Reject requests where no matching tenant context is found with `403 FORBIDDEN`.

#### [NEW] `apps/api/src/common/decorators/tenant-context.decorator.ts`

- `@TenantContext()` parameter decorator to extract resolved tenant context inside controllers.

#### [NEW] `apps/api/src/common/interceptors/response.interceptor.ts`

- Wrap all successful responses in the standard envelope:
  ```json
  { "success": true, "data": {...} }
  ```
- The error envelope is handled by a global exception filter.

#### [NEW] `apps/api/src/common/filters/http-exception.filter.ts`

- Normalize all errors to the documented error envelope format from `API_SPEC.md`.

---

### Task 3 — NestJS: Auth Module

#### [NEW] `apps/api/src/modules/auth/auth.module.ts`

#### [NEW] `apps/api/src/modules/auth/auth.controller.ts`

#### [NEW] `apps/api/src/modules/auth/auth.service.ts`

Implements the following endpoints per `API_SPEC.md`:

| Method  | Endpoint                           | Purpose                                        |
| ------- | ---------------------------------- | ---------------------------------------------- |
| `GET`   | `/api/v1/auth/me`                  | Return User + active Employee + tenant context |
| `POST`  | `/api/v1/auth/organization-select` | Switch active tenant                           |
| `GET`   | `/api/v1/auth/profile`             | Return current User profile                    |
| `PATCH` | `/api/v1/auth/profile`             | Update display name or avatar                  |

---

### Task 4 — NestJS: Business Module

#### [NEW] `apps/api/src/modules/business/business.module.ts`

#### [NEW] `apps/api/src/modules/business/business.controller.ts`

#### [NEW] `apps/api/src/modules/business/business.service.ts`

Implements:

| Method  | Endpoint                    | Purpose                                       |
| ------- | --------------------------- | --------------------------------------------- |
| `POST`  | `/api/v1/business`          | Create a new business (tenant) on first login |
| `GET`   | `/api/v1/business/profile`  | Get business profile                          |
| `PATCH` | `/api/v1/business/profile`  | Update business profile                       |
| `GET`   | `/api/v1/business/settings` | Get business settings                         |
| `PATCH` | `/api/v1/business/settings` | Update business settings                      |

---

### Task 5 — NestJS: Members Module

#### [NEW] `apps/api/src/modules/members/members.module.ts`

#### [NEW] `apps/api/src/modules/members/members.controller.ts`

#### [NEW] `apps/api/src/modules/members/members.service.ts`

Implements:

| Method   | Endpoint                 | Purpose                             |
| -------- | ------------------------ | ----------------------------------- |
| `GET`    | `/api/v1/members`        | List all employees in the tenant    |
| `POST`   | `/api/v1/members/invite` | Invite a new employee by email      |
| `PATCH`  | `/api/v1/members/:id`    | Update employee title or department |
| `DELETE` | `/api/v1/members/:id`    | Soft-delete an employee             |

---

### Task 6 — NestJS: Onboarding Flow

#### [NEW] `apps/api/src/modules/onboarding/onboarding.module.ts`

#### [NEW] `apps/api/src/modules/onboarding/onboarding.controller.ts`

#### [NEW] `apps/api/src/modules/onboarding/onboarding.service.ts`

Handles new business setup:

- `POST /api/v1/onboarding/start` — creates Tenant + User + Employee records after Clerk signup.
- `PATCH /api/v1/onboarding/profile` — saves answers to business interview as `BusinessProfile`.
- `GET /api/v1/onboarding/status` — returns current onboarding step for UI routing.

---

### Task 7 — Frontend: shadcn/ui Setup

#### [MODIFY] `apps/web`

- Initialize shadcn/ui CLI inside `apps/web`.
- Add base components: `Button`, `Card`, `Input`, `Label`, `Avatar`, `Badge`, `Separator`, `Tooltip`, `Skeleton`.
- Configure Clerk's `<ClerkProvider>` in `apps/web/src/app/layout.tsx`.

---

### Task 8 — Frontend: Dashboard Shell Layout

#### [NEW] `apps/web/src/app/(dashboard)/layout.tsx`

- Protected route layout using Clerk's `auth()` or `<SignedIn>`.
- Sidebar navigation: Dashboard, Leads, Workflows, Settings, Members.
- Top header with tenant name, user avatar, and notification indicator (static for now).

#### [NEW] `apps/web/src/app/(dashboard)/page.tsx`

- Dashboard home with static summary cards (Leads, Active Workflows, Members, Pending Approvals).
- Skeleton loading states.

#### [NEW] `apps/web/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`

#### [NEW] `apps/web/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`

- Clerk-powered sign-in and sign-up pages using `<SignIn />` and `<SignUp />` components.

#### [NEW] `apps/web/src/app/(auth)/onboarding/page.tsx`

- Multi-step business onboarding form (business name, industry, team size).
- Calls `POST /api/v1/onboarding/start` then `PATCH /api/v1/onboarding/profile`.

---

## Verification Plan

### Automated Checks

- `pnpm exec turbo run build lint typecheck` must pass across all 9 workspaces.
- `pnpm exec prisma migrate status` must show all migrations applied.

### Manual Verification

1. Start Docker services: `docker compose up -d`.
2. Start NestJS API: `pnpm --filter api run start:dev`.
3. Start Next.js: `pnpm --filter web run dev`.
4. Sign up via Clerk on `http://localhost:3000`.
5. Verify `GET /api/v1/auth/me` returns correct user + tenant context.
6. Verify dashboard shell renders with navigation sidebar.
7. Verify `GET /health` still returns HTTP 200.
