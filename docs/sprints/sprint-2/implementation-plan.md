# Implementation Plan — Sprint 2: Business Foundation

**Sprint**: Sprint 2 – Business Foundation  
**Status**: Ready to Begin  
**Depends on**: Sprint 1 (v0.1.0 — ✅ Complete)  
**Version Target**: v0.2.0  
**Branch**: `feat/sprint-2-business-foundation`

---

## Technical Context & Architectural Rules

1. **Strict Multi-Tenancy**: Every backend database query must resolve the active `tenantId` from the authenticated request context. Under no circumstances should cross-tenant data leak.
2. **AI Decides, Engine Executes**: The AI (Gemini) is not integrated in Sprint 2. All operations are deterministic, triggered by dashboard endpoints and onboarding forms.
3. **Clerk as Identity Provider**: User credentials, signup, and login are delegated to Clerk. The AutoOps API resolves the Clerk JWT, maps it to the internal `User` and `Employee` records, and handles active tenant resolution directly.
4. **No Code Placeholders**: Avoid mock files or draft placeholders. Code must be fully implemented, typed, and linted.

---

## Sprint 2 Tasks

---

### Task 2.1 — Clerk Authentication

#### Purpose

Configure Clerk authentication for the Next.js frontend (`apps/web`) and NestJS backend (`apps/api`), enabling secure user signup, login, session validation, and JWT verification.

#### Deliverables

- **Frontend Config**: Install `@clerk/nextjs` in `apps/web`. Wire `<ClerkProvider>` into `apps/web/src/app/layout.tsx`.
- **Protected Frontend Routes**: Establish Middleware to redirect unauthenticated traffic to `/sign-in` and `/sign-up`.
- **Backend Clerk Guard**: Install `@clerk/clerk-sdk-node` or configure a custom JWT verification guard in `apps/api` utilizing Clerk's JSON Web Key Set (JWKS).
- **Backend Auth Controller & Service**:
  - `GET /api/v1/auth/me` - Resolves authenticated User details, their active tenant context, and current organization membership.
  - _(Note: POST /api/v1/auth/organization-select is removed; organization switching is deferred to a future sprint. Active tenant is resolved directly from the authenticated user context)._
- **Root `.env` Updates**: Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_JWT_KEY` (or JWKS URL) to `.env` and `.env.example`.

#### Dependencies

- Task 1 (Sprint 1 Monorepo)

#### Verification Steps

1. Attempt to access `/dashboard` in Next.js; verify redirection to Clerk's sign-in page.
2. Sign up a new user via Clerk on the frontend.
3. Make an HTTP request to `GET /api/v1/auth/me` with a valid Bearer JWT; verify it returns HTTP 200 with user data.
4. Make the same request with an invalid or expired token; verify HTTP 401.

#### Acceptance Criteria

- Unauthenticated access to private frontend and API routes is blocked.
- Clerk JWKS validation runs locally without external network lookups per request.
- The JWT claims map correctly to `req.user.clerkId`.

#### Estimated Time

4 hours

#### Expected Git Commit Message

`feat(auth): configure clerk authentication for frontend and backend`

---

### Task 2.2 — Business (Tenant) Foundation

#### Purpose

Establish the relational Prisma database models for multi-tenant isolation and implement the endpoint for creating new businesses.

#### Deliverables

- **Prisma Schema Update**:
  - `Tenant` model: UUID, name, slug, status (enum: `onboarding_pending`, `onboarding_interview`, `active`, `suspended`), plan, onboardingStep (String representing progress status), timestamps, soft-delete field.
  - `User` model: UUID, clerkId (unique), email (unique), firstName, lastName, avatarUrl, timestamps.
  - `Employee` model: UUID, tenantId (foreign key), userId (foreign key), role (enum: `OWNER`, `ADMIN`, `MEMBER`), title, status (enum), timestamps.
  - _(Note: Department, Role, Permission, RolePermission, and EmployeeRole tables are omitted for now. Advanced RBAC is deferred to a future sprint)._
- **Prisma Migration**: Run `pnpm exec prisma migrate dev --name business-foundation` to create the initial tables.
- **Backend Business Controller & Service**:
  - `POST /api/v1/businesses` - Create new tenant business shell, mapping the creating user as the `OWNER` employee.
- **Multi-Tenant Context Guard/Middleware**:
  - Resolve the active `Employee` and `tenantId` from the verified User ID.
  - Attach a validated `tenantContext` object `{ userId, tenantId, employeeId }` to the request object for use by domain modules.

#### Dependencies

- Task 2.1 (Clerk Auth)

#### Verification Steps

1. Run the database migration and verify `Tenant`, `User`, and `Employee` tables are created in PostgreSQL.
2. Authenticate, call `POST /api/v1/businesses` with body `{"name": "Aura Realty", "industry": "real_estate", "country": "IN"}`.
3. Verify database shows one new `Tenant` record and a matching `Employee` record linked to the user with `role = OWNER`.
4. Send requests without tenant context; verify they are rejected with HTTP 403.

#### Acceptance Criteria

- All tenant-owned records have `tenantId` field and constraints.
- Foreign key cascading is restricted (deleting a tenant does not hard-delete audit logs).
- Prisma query filters systematically inject the active `tenantId`.

#### Estimated Time

6 hours

#### Expected Git Commit Message

`feat(business): implement tenant database models and context middleware`

---

### Task 2.3 — Business Profile

#### Purpose

Implement the business profile schema and endpoints, enabling businesses to store their operating profile (industry, localization details, contact information, branding parameters) as resolved during onboarding.

#### Deliverables

- **Prisma Schema Update**:
  - `BusinessProfile` model: UUID, tenantId (unique foreign key), industry, status, details (JSONB), timestamps.
- **Backend API Endpoints**:
  - `GET /api/v1/businesses/active/profile` - Retrieve the AI-onboarded profile details for the active tenant.
  - `PATCH /api/v1/businesses/active/profile` - Update profile properties (name, contact email, phone, custom branding colors, logo URL).
- **Validation Schemas**: Write validation decorators (`class-validator` / `zod`) for incoming profile modification payloads.

#### Dependencies

- Task 2.2 (Business Foundation)

#### Verification Steps

1. Call `PATCH /api/v1/businesses/active/profile` with valid updates. Verify the database updates the profile.
2. Call the patch endpoint with invalid fields (e.g. invalid email format); verify HTTP 400 validation error envelope.
3. Call `GET /api/v1/businesses/active/profile` and verify it returns HTTP 200 with the correct profile payload.

#### Acceptance Criteria

- Profile updates are isolated to the requester's `tenantId`.
- Branding logo URLs are validated as standard URL strings.
- Profile JSONB configuration strictly matches defined TypeScript interfaces.

#### Estimated Time

4 hours

#### Expected Git Commit Message

`feat(business): add business profile models and profile management api`

---

### Task 2.4 — Business Settings

#### Purpose

Implement tenant-specific operational settings (timezone, currency, default parameters, business hours) to drive downstream scheduling and workflow engines.

#### Deliverables

- **Prisma Schema Update**:
  - `BusinessSettings` model: UUID, tenantId (unique foreign key), timezone, locale, currency, businessHours (JSONB), approvalPolicies (JSONB), timestamps.
- **Backend API Endpoints**:
  - `GET /api/v1/businesses/active/settings` - Retrieve tenant configuration settings.
  - `PATCH /api/v1/businesses/active/settings` - Update timezone, business hours, and policies.

#### Dependencies

- Task 2.2 (Business Foundation)

#### Verification Steps

1. Call `PATCH /api/v1/businesses/active/settings` to modify the timezone and currency. Verify changes persist.
2. Retrieve the active settings; verify the response contains `timezone`, `currency`, `businessHours`, and `approvalPolicies` fields matching the API spec.

#### Acceptance Criteria

- The timezone field must contain a valid IANA timezone string (e.g. `Asia/Kolkata`).
- Currency must follow ISO 4217 standard (e.g. `INR`, `USD`).
- Business settings are scoped strictly by `tenantId`.

#### Estimated Time

4 hours

#### Expected Git Commit Message

`feat(business): add business settings schema and configuration api`

---

### Task 2.5 — Employee & Roles (Foundation)

#### Purpose

Establish organization membership mapping and a simplified employee directory context. This facilitates tracking which users belong to which business and assigns basic ownership status, preparing the layout shell without implementing complex permissions.

#### Deliverables

- **Prisma Schema Update**:
  - Store the membership role directly on the `Employee` model as a database enum: `OWNER`, `ADMIN`, `MEMBER`.
  - Link `Employee` directly to `User` and `Tenant`.
  - _(Note: Do NOT implement Department, Role, Permission, RolePermission, or EmployeeRole tables, advanced RBAC, permission guards, or permission matrix. Advanced RBAC is deferred to a future sprint)._
- **Backend API Endpoints**:
  - `GET /api/v1/businesses/active/members` - Lists all employees in the current active business tenant with cursor-based pagination.
  - `POST /api/v1/businesses/active/members/invite` - Generates a pending Employee membership shell under the current Tenant (no mailer integration yet).

#### Dependencies

- Task 2.2 (Business Foundation)

#### Verification Steps

1. Run database migration; verify `Employee` table includes a `role` enum field (`OWNER`, `ADMIN`, `MEMBER`).
2. Query `GET /api/v1/businesses/active/members` and verify it returns all tenant employees with their identity details and simple role.
3. Invite an employee; verify a new `Employee` record is added to the database under the correct tenant with status `PENDING` and role `MEMBER`.

#### Acceptance Criteria

- Employee records are strictly scoped by `tenantId`.
- Member listings require standard authentication and active tenant context.
- Foundational roles (`OWNER`, `ADMIN`, `MEMBER`) support basic business operations without granular permission checks.

#### Estimated Time

4 hours

#### Expected Git Commit Message

`feat(members): implement simplified membership and member directory api`

---

### Task 2.6 — Business Onboarding Skeleton

#### Purpose

Scaffold the multi-step business onboarding UI flow on the Next.js frontend, persisting onboarding step progression directly in the database so progress survives refreshes and works across multiple client devices.

#### Deliverables

- **Database Persistence**:
  - Store `onboardingStep` directly in the database (on the `Tenant` model).
- **Backend API Endpoints**:
  - `GET /api/v1/onboarding/status` - Retrieves the active tenant's onboarding progress step from the database.
  - `PATCH /api/v1/onboarding/step` - Persists the current onboarding progress step to the database.
- **Onboarding Page Layout**: Create `/onboarding` route in `apps/web`.
- **Step Components (Onboarding Skeleton)**:
  - Step 1: Create Business Shell (Name, Industry, Country).
  - Step 2: Basic Business Details (Branding placeholder, email, phone).
  - Step 3: Localization Details (Select Timezone, Currency).
  - Step 4: Progress Confirmation & Setup Completion.
- **State Management**:
  - Frontend requests onboarding status on mount from `GET /api/v1/onboarding/status`.
  - As the user clicks "Next", the frontend calls `PATCH /api/v1/onboarding/step` to save progress.
  - _(Note: Do NOT rely on Local Storage or URL parameters for onboarding state. State is persisted server-side)._

#### Dependencies

- Task 2.3 (Profile APIs), Task 2.4 (Settings APIs)

#### Verification Steps

1. Navigate to `/onboarding`. Complete Step 1; verify database updates `onboardingStep` to step 2.
2. Refresh the browser; verify the UI reads progress from the database and loads Step 2 directly.
3. Access `/onboarding` from another browser session; verify step progress matches database state.

#### Acceptance Criteria

- Onboarding state is completely independent of the client device (persisted in DB).
- Page loads fetch state dynamically from the API status endpoint.
- Completed onboarding locks access to `/onboarding` routes.

#### Estimated Time

6 hours

#### Expected Git Commit Message

`feat(web): persist business onboarding step progress server-side`

---

### Task 2.7 — Dashboard Shell

#### Purpose

Design the responsive React dashboard shell featuring layout navigation elements, headers, sidebar hooks, user profile dropdowns, and tenant context controls.

#### Deliverables

- **Component Setup**: Install base shadcn/ui primitives (`Button`, `Card`, `Input`, `Label`, `Avatar`, `Badge`, `DropdownMenu`, `Sidebar`, `Separator`) in `apps/web`.
- **Dashboard Layout Wrapper**: `apps/web/src/app/(dashboard)/layout.tsx`.
- **Sidebar Component**: Collapsible sidebar with navigation routes: Dashboard, Leads, Workflows, Settings, Members.
- **Header Component**: Static business name display (no tenant switch dropdown at this stage, tenant is resolved directly from authenticated user context), notification bell indicator (static), user profile settings action, logout controller.
- **Static Widgets Shell**: `apps/web/src/app/(dashboard)/page.tsx` displaying empty KPI overview widgets (Leads counter, active workflows list, pending approvals counter) with skeleton loaders.

#### Dependencies

- Task 2.1 (Clerk Auth Setup)

#### Verification Steps

1. Navigate to `/dashboard` and check layout styling on Desktop (sidebar visible) vs. Mobile (sidebar collapsed into drawer).
2. Click menu links; verify matching paths load inside the dashboard viewport shell.
3. Trigger page reloads; confirm session context values refresh dynamically.

#### Acceptance Criteria

- No actual leads, workflows, or real-time webhooks data should be populated (skeleton placeholders only).
- Layout handles screen resizing cleanly without breaking grid structures (responsive CSS).
- Interactivity utilizes smooth CSS micro-animations.

#### Estimated Time

6 hours

#### Expected Git Commit Message

`feat(web): implement dashboard layout shell with responsive sidebar`

---

### Task 2.8 — Sprint Verification

#### Purpose

Conduct end-to-end regression checks across all Sprint 2 tasks, ensuring auth guards, multi-tenant middleware, business endpoints, database tables, and the Next.js shell integrate without regression.

#### Deliverables

- **Prisma Migration Verification**: Assert all migration actions apply cleanly.
- **Comprehensive Workspace Verification Checklist**: Check off all tasks against the Sprint Definition of Done.
- **Documentation Update**: Update `walkthrough.md` with verification reports.

#### Dependencies

- Tasks 2.1 to 2.7

#### Verification Steps

1. Run `pnpm exec prisma migrate status` - verify database state is up to date.
2. Spin up all containers and development servers locally.
3. Complete onboarding signup from a clean browser session, create a business, adjust settings, and inspect members list.
4. Execute `pnpm exec turbo run build lint typecheck` and verify zero compiler or linting exceptions across all workspaces.

#### Acceptance Criteria

- The Next.js dashboard shell connects to the NestJS API under Clerk session security.
- Outbound responses follow standard envelope structures.
- All Docker databases and cache servers remain healthy.

#### Estimated Time

3 hours

#### Expected Git Commit Message

`test(repo): verify sprint 2 integration and build pipeline`

---

## Verification Plan

### Automated Tests

- Build verification:
  ```bash
  pnpm install
  pnpm exec turbo run build lint typecheck
  ```
- Database migration alignment:
  ```bash
  pnpm exec prisma migrate status
  ```
- Unit/E2E test suite check:
  ```bash
  pnpm --filter api run test
  ```

### Manual Verification

1. Launch docker database containers (`docker compose up -d`).
2. Boot NestJS core: `pnpm --filter api run start:dev`.
3. Boot Next.js dashboard: `pnpm --filter web run dev`.
4. Walk through user sign-up, business configuration setup, settings updates, member list view, and dashboard navigation. Confirm HTTP headers, request isolation, and styling boundaries.
