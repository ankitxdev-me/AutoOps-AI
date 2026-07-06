# AutoOps AI - Project Context & Developer Entry Point

Version: 1.0  
Status: Active Entry Point  
Audience: Software engineers, prompt designers, DevOps engineers, and AI coding assistants (ChatGPT, Claude, Cursor, Windsurf, Codex, Gemini)

---

> [!IMPORTANT]
> **READ THIS FILE FIRST BEFORE COMMITTING ANY CHANGES.**  
> Every development session, bug fix, or refactor task must begin by consulting this document. It serves as the single entry point linking the code, schemas, documentation, and operational policies.

---

## 1. Project Overview

### Product Name & Tagline

- **Product Name**: AutoOps AI
- **Tagline**: The AI Business Operating System

### Vision & Mission

- **Vision**: To eliminate human operational bottlenecks in small and medium-sized enterprises by enabling automated control systems configured through natural language.
- **Mission**: Provide businesses with a secure, multi-tenant execution layer that converts unstructured instructions into structured workflows and executes them through standard APIs.
- **One-line Pitch**: An AI-powered business operating system that translates conversational commands into executable, deterministic workflows that integrate with existing APIs.

### Problem Statement

Most automation tools (e.g. Zapier, Make) assume technical proficiency and require complex field-mapping interfaces. Small businesses (real estate, healthcare, clinics, logistics) still rely on manual operations (calls, WhatsApp messages, Excel sheets) because digital integrations are difficult to manage. AutoOps AI removes this friction by allowing owners to describe and deploy custom automations in plain English.

### Current MVP

The MVP focuses on the **Real Estate** vertical. It demonstrates call handling (Vapi Voice AI), lead capturing, automated agent assignment (RBAC routing), site-visit calendar scheduling, WhatsApp confirmations, and a live dashboard showing execution traces.

### Future Vision

To become the operational controller for businesses across multiple industries (Healthcare, Education, Retail, Restaurants, Finance, Logistics, and Professional Services) using the same core Workflow Engine and Tool Registry.

---

## 2. Documentation Index

The following documents represent the project's source of truth. Refer to this index to identify which document to load based on the task:

| Document                                                                                                     | Purpose                                                                                         | Priority     | Read When                                                       |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------- |
| [PROJECT_CONTEXT.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/PROJECT_CONTEXT.md)              | **Master Entry Point**: Project summary, rules, tech stack, sprint state, and onboarding steps. | **Critical** | Read at the start of every developer or AI session.             |
| [MASTER_BLUEPRINT.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/MASTER_BLUEPRINT.md)       | High-level roadmap, core product vision, main user journeys, and industry scope.                | **High**     | Understanding user personas, user stories, and features.        |
| [SYSTEM_ARCHITECTURE.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/SYSTEM_ARCHITECTURE.md) | Technical architecture, monorepo structures, request paths, and execution flows.                | **Critical** | Implementing routing, API modules, or system dependencies.      |
| [DATABASE_SCHEMA.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/DATABASE_SCHEMA.md)         | Database models, relations, index strategies, soft deletion rules, and tenant parameters.       | **Critical** | Adding database migrations, updating tables, or tuning queries. |
| [TOOL_REGISTRY.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/TOOL_REGISTRY.md)             | Registry contracts, validation schemas, retry policies, and execution lifecycle patterns.       | **Critical** | Creating tool adapters or matching AI plans to system tasks.    |
| [API_SPEC.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/API_SPEC.md)                       | Standard API specifications, request/response models, and status codes.                         | **High**     | Modifying NestJS endpoints, controller schemas, or endpoints.   |
| [AI_PROMPTS.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/AI_PROMPTS.md)                   | System prompt guardrails, agent profiles, context structures, and memory configurations.        | **High**     | Iterating on LLM prompt variables or voice assistant behaviors. |
| [ROADMAP.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/ROADMAP.md)                         | Sprint deliverables, MVP features, timeline structures, and project metrics.                    | **Medium**   | Reviewing sprint milestones, tasks, or metrics.                 |
| [DEMO_SCRIPT.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/DEMO_SCRIPT.md)                 | Interactive demonstration scripts and reset flows for hackathon judges.                         | **Medium**   | Resetting databases, staging calls, or demonstrating workflows. |

---

## 3. Current Project Status

Sprint 0 and Sprint 1 are complete. Sprint 2 is the active development sprint.

```text
+---------------------------------------------------------+
|                    Sprint 0 Dashboard                   |
+---------------------------------------------------------+
|  ✅ Architecture & Specs Complete                       |
|  ✅ Database Schema Documented                          |
|  ✅ Tool Registry Specifications Validated              |
|  ✅ API & Prompts Contracts Confirmed                   |
|  ✅ Sprint Roadmap Approved                             |
+---------------------------------------------------------+
|  Status: ✅ COMPLETE                                    |
+---------------------------------------------------------+

+---------------------------------------------------------+
|                    Sprint 1 Dashboard                   |
+---------------------------------------------------------+
|  ✅ pnpm + Turborepo monorepo initialized               |
|  ✅ NestJS backend scaffolded (apps/api)                |
|  ✅ Next.js 15 frontend scaffolded (apps/web)           |
|  ✅ Workspace packages created (shared, ui, ai,         |
|     workflow-engine, integrations, config)              |
|  ✅ Docker Compose (PostgreSQL 15 + Redis 7)            |
|  ✅ Prisma ORM + migration workflow configured          |
|  ✅ ESLint, Prettier, Husky, commitlint configured      |
|  ✅ GitHub Actions CI pipeline configured               |
|  ✅ GET /health endpoint verified                       |
|  ✅ All 16 Turbo tasks pass (build, lint, typecheck)    |
|  ✅ Git tagged: v0.1.0 / sprint-1-complete              |
+---------------------------------------------------------+
|  Status: ✅ COMPLETE  |  Version: v0.1.0                |
+---------------------------------------------------------+

+---------------------------------------------------------+
|                    Sprint 2 Dashboard                   |
+---------------------------------------------------------+
|  ⬜ Clerk Authentication & JWT Guard                   |
|  ⬜ Tenant Context Middleware                           |
|  ⬜ Business Creation & Onboarding Flow                 |
|  ⬜ Business Profile & Settings API                    |
|  ⬜ Employee & Role Management                         |
|  ⬜ Auth Module (/auth/me, /auth/profile)               |
|  ⬜ Next.js Dashboard Shell                             |
|  ⬜ Sign-in / Sign-up pages (Clerk)                    |
|  ⬜ Onboarding Form UI                                  |
+---------------------------------------------------------+
|  Status: 🚀 ACTIVE  |  Target Version: v0.2.0          |
+---------------------------------------------------------+
```

- **Current Phase**: Phase 2 - Database Schema & Auth Core
- **Current Sprint**: Sprint 2 - Business Foundation
- **Current Goal**: Implement Clerk authentication, tenant context middleware, business management APIs, and the Next.js dashboard shell.
- **Next Milestone**: CRM Lead & Property management (Sprint 3).

---

## 4. Tech Stack Summary

The technical stack is structured for horizontal scalability and clean module extraction:

- **Frontend**: Next.js 15, React 19, Tailwind CSS, shadcn/ui. (Refer to [SYSTEM_ARCHITECTURE.md:L97](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/SYSTEM_ARCHITECTURE.md#L97))
- **Backend**: NestJS, TypeScript. Built around feature modules. (Refer to [SYSTEM_ARCHITECTURE.md:L829](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/SYSTEM_ARCHITECTURE.md#L829))
- **Database**: PostgreSQL (Prisma ORM). (Refer to [DATABASE_SCHEMA.md:L22](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/DATABASE_SCHEMA.md#L22))
- **Authentication**: Clerk JWT Token authentication. (Refer to [SYSTEM_ARCHITECTURE.md:L664](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/SYSTEM_ARCHITECTURE.md#L664))
- **AI Engine**: Gemini 2.5 Pro via Google AI SDK. (Refer to [AI_PROMPTS.md:L11](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/AI_PROMPTS.md#L11))
- **Workflow Engine**: Custom-built runtime running JSON-defined steps. (Refer to [SYSTEM_ARCHITECTURE.md:L270](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/SYSTEM_ARCHITECTURE.md#L270))
- **Voice AI**: Vapi platform integration for call webhook processing. (Refer to [SYSTEM_ARCHITECTURE.md:L465](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/SYSTEM_ARCHITECTURE.md#L465))
- **Queue/Cache**: Redis with BullMQ. (Refer to [SYSTEM_ARCHITECTURE.md:L625](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/SYSTEM_ARCHITECTURE.md#L625))
- **Real-time Eventing**: Socket.IO for dashboard updates. (Refer to [SYSTEM_ARCHITECTURE.md:L167](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/SYSTEM_ARCHITECTURE.md#L167))
- **Media Storage**: Cloudinary for file metadata links. (Refer to [SYSTEM_ARCHITECTURE.md:L253](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/SYSTEM_ARCHITECTURE.md#L253))
- **Deployment**: Docker, Nginx, PM2 on DigitalOcean VPS. (Refer to [SYSTEM_ARCHITECTURE.md:L700](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/SYSTEM_ARCHITECTURE.md#L700))

---

## 5. Folder Structure

We use a Turborepo workspace structure to organize our applications and shared modules:

```text
autoops-ai/
├── apps/
│   ├── web/                     # Next.js Dashboard UI & Onboarding Chat
│   └── api/                     # NestJS Core Backend Service
├── packages/
│   ├── shared/                  # Common TypeScript definitions & validation schemas
│   ├── workflow-engine/         # Core step runner & trigger matchers
│   ├── ai/                      # LLM adapters, system prompts & onboarding state
│   ├── integrations/            # Tool Adapters (Gmail, Calendar, WhatsApp)
│   └── ui/                      # Shared design components (shadcn/ui)
├── docs/                        # Architecture & specifications
├── prisma/                      # Prisma schemas & PostgreSQL migrations
├── package.json
└── turborepo.json
```

### Core Responsibilities

- `apps/web`: Next.js web application. Manages onboarding, workflow configuration, lead lists, properties, and dashboards.
- `apps/api`: NestJS application. Resolves tenant contexts, maps Clerk identities to database users, and validates parameters.
- `packages/workflow-engine`: Deterministic runner that evaluates workflow steps and conditions, logs results, and manages retries.
- `packages/ai`: Processes system prompts and handles AI interactions.
- `packages/integrations`: Connects external tools (Google, WhatsApp, Cloudinary) to abstract adapter interfaces.

---

## 6. Architecture Summary

AutoOps AI uses a structured execution flow to keep the system secure and reliable:

```text
[Natural Language Input]
       |
       v
[AI Agent (Gemini 2.5 Pro)] -> Proposes structured execution JSON
       |
       v
[Backend API Validation] -> Validates tool contracts & checks tenant permissions
       |
       v
[Workflow Engine Execution] -> Executes tasks sequentially through tools
       |
       v
[Registered Tools] -> Connects to Google, WhatsApp, CRM, or local database
       |
       v
[Durable Records & Real-Time updates] -> Writes logs & updates dashboard UI
```

- **AI Agent**: Parses commands and extracts parameters. It cannot query the database or call APIs directly.
- **Workflow Engine**: Resolves variables and executes actions. It handles error recovery, approvals, and retries.
- **Tool Registry**: Declares input/output JSON schemas for available tools.
- **Integrations Layer**: Manages OAuth flows, token storage, and webhook verification.
- **Database Layer**: Enforces tenant-isolation by filtering queries using a verified `tenantId`.

---

## 7. Development Rules

Every engineer and AI assistant must follow these core development rules:

1. **AI Decides, Engine Executes**: The AI model only proposes plans. All database updates and API calls must go through the Workflow Engine.
2. **Strict Multi-Tenancy**: Database queries must filter by the user's verified `tenantId`.
3. **No Unknown Tools**: The AI and workflows can only use tools declared in the Tool Registry. Do not hardcode custom integrations.
4. **Safety & Approvals**: Workflows that trigger financial transactions, discount codes, or external messages require manual user approval.
5. **No Credentials in Log Files**: Redact passwords, personal details (PII), and access tokens from logs.
6. **No Placeholders**: Do not check in placeholder keys or mock paths. Use environment variables or configuration files.

---

## 8. Coding Standards

- **TypeScript**: Use strict mode typing. Avoid using `any`; define explicit interfaces or schemas instead.
- **Dependency Injection**: Use NestJS dependency injection mechanisms to manage services.
- **Error Handling**: Use the standardized error format ([API_SPEC.md:L43](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/API_SPEC.md#L43)) to return structured errors to the UI.
- **Database Access**: All queries must use Prisma Client. Do not write raw SQL queries.
- **Testing**: Maintain unit tests for all domain logic. Security and core runner modules require 100% test coverage.
- **Git Commit Convention**: Use conventional commits (e.g. `feat(api): add lead assignment endpoint`).

---

## 9. AI Instructions

If you are an AI assistant helping with coding, follow these instructions:

- **Read Context First**: Read this document ([PROJECT_CONTEXT.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/PROJECT_CONTEXT.md)) to understand the project state.
- **Consult Documentation**: Read the specific specs (e.g. [DATABASE_SCHEMA.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/DATABASE_SCHEMA.md) before writing migrations) before implementing changes.
- **Implement Step-by-Step**: Focus on one capability at a time. Write complete, functional code instead of stub functions.
- **Preserve Compatibility**: Do not change folder structures or modify tables without checking existing relationships.
- **Validate Inputs**: Ensure inputs are validated against schema definitions prior to processing.

---

## 10. Development Workflow

```text
1. Requirement Check -> Verify sprint target and user requirements.
       |
       v
2. Doc Review -> Review API spec, DB schema, and Tool Registry definitions.
       |
       v
3. Implementation -> Write NestJS modules, React interfaces, or tool adapters.
       |
       v
4. Validation -> Run unit tests and verify tenant-isolation checks.
       |
       v
5. PR Submission -> Submit Conventional Commits, update log documentation.
```

---

## 11. Sprint Plan Summary

Below is a summary of the next development sprints (refer to [ROADMAP.md:L50](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/ROADMAP.md#L50) for the complete roadmap):

- **Sprint 1: Foundation**: Set up monorepo workspaces, install core dependencies, initialize the database connection, and verify Docker containers.
- **Sprint 2: Authentication & Dashboard**: Implement Clerk session verification, tenant context middleware, and the landing page UI layout.
- **Sprint 3: CRM (Leads/Properties)**: Add endpoints for lead capturing and property inventory search, and configure timeline activity trackers.
- **Sprint 4: Workflow Engine**: Implement the trigger matcher, the execution step runner, manual approval queues, and Socket.IO status updates.
- **Sprint 5: AI Onboarding Agent**: Integrate onboarding interview conversational paths and the AI workflow generation parser.

---

## 12. Current TODO Checklist

### Architecture & Documentation

- [x] Create [MASTER_BLUEPRINT.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/MASTER_BLUEPRINT.md)
- [x] Create [SYSTEM_ARCHITECTURE.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/SYSTEM_ARCHITECTURE.md)
- [x] Create [DATABASE_SCHEMA.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/DATABASE_SCHEMA.md)
- [x] Create [TOOL_REGISTRY.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/TOOL_REGISTRY.md)
- [x] Create [API_SPEC.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/API_SPEC.md)
- [x] Create [AI_PROMPTS.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/AI_PROMPTS.md)
- [x] Create [ROADMAP.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/docs/ROADMAP.md)
- [x] Create [PROJECT_CONTEXT.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/PROJECT_CONTEXT.md)

### Workspace Setup

- [x] Initialize Turborepo Monorepo (Sprint 1)
- [x] Configure `apps/api` (NestJS) and `apps/web` (Next.js) (Sprint 1)
- [x] Configure database connections & migration rules (Sprint 1)

### Feature Implementations

- [ ] Implement Clerk Auth & Tenant Context Middleware (Sprint 2)
- [ ] Implement Business Profile, Settings & Members API (Sprint 2)
- [ ] Implement Business Onboarding Flow (Sprint 2)
- [ ] Implement Next.js Dashboard Shell (Sprint 2)
- [ ] Implement CRM (Leads & Properties modules) (Sprint 3)
- [ ] Implement Workflow Engine step processing & approval logic (Sprint 4)
- [ ] Integrate onboarding conversational paths and prompt parser (Sprint 5)

---

## 13. Session Continuation Guide

When starting a new development session, follow these steps:

```text
Step 1: Read PROJECT_CONTEXT.md to identify the current sprint focus.
                     |
                     v
Step 2: Read target specs (e.g. read API_SPEC.md before writing endpoints).
                     |
                     v
Step 3: Implement features incrementally; do not use mock placeholders.
                     |
                     v
Step 4: Run test validations and verify data isolation filters.
                     |
                     v
Step 5: Log conventional commits and merge PR updates.
```

---

## 14. Final Notes

This [PROJECT_CONTEXT.md](file:///c:/Users/ankit/OneDrive/Documents/AutoOps%20AI/PROJECT_CONTEXT.md) is the master onboarding guide for AutoOps AI. It provides an index of all engineering specifications, defines our security boundaries, and tracks our development progress.

When starting a new session, read this context file, check the active sprint target, and continue implementing features as outlined in the roadmap.
