# AutoOps AI - Master Project Blueprint

Version: 1.0

## Project Vision

Project name: AutoOps AI

Tagline: The AI Business Operating System

One-line pitch: Hermes AI is a multi-tenant SaaS platform that enables businesses to automate operations using natural language. Business owners describe workflows in plain English, and AI converts them into executable workflows that integrate with their existing tools.

## Problem Statement

Millions of SMEs still operate using phone calls, WhatsApp, Excel, paper records, and manual approvals. Most automation platforms require technical knowledge and assume businesses already use digital software.

Hermes AI removes this barrier by allowing businesses to automate operations simply by describing them in natural language.

## Core Idea

Hermes AI is not a chatbot, ERP, CRM, or traditional automation tool. It is an AI Business Operating System.

Think of it as an AI employee that understands business processes and executes them automatically through a secure execution layer.

## Target Users

Primary industries:

- Real estate
- Healthcare
- Education
- Restaurants
- Retail
- Agencies
- Small businesses

Later industries:

- Manufacturing
- Logistics
- Finance
- HR

## MVP Industry

The MVP industry is real estate.

Real estate is ideal because it includes phone calls, WhatsApp, appointments, brochures, negotiations, invoices, and CRM-like operations. This demonstrates nearly every core capability of the platform.

## Main User Journey

1. Business owner signs up.
2. AI interviews the owner.
3. Business profile is created.
4. Owner connects apps.
5. Owner writes a workflow in natural language.
6. AI converts the workflow into executable JSON.
7. Workflow is stored.
8. Business events trigger workflows.
9. AI-guided execution runs tasks through tools.
10. Owner monitors everything from the dashboard.

## Business Onboarding

The AI interviews the business owner to understand the company, operating model, tools, and approval structure.

Example questions:

- What industry are you in?
- How do customers contact you?
- Which tools do you use?
- Do you use WhatsApp?
- Do you use email?
- Do you have a CRM?
- How many employees do you have?
- What is your approval hierarchy?
- What are your business hours?
- What communication channels do you prefer?

The result is a structured Business Profile.

## Business Profile

Every business has:

- Business details
- Employees
- Departments
- Integrations
- Workflows
- Permissions
- Settings

## Core Modules

- Authentication: Clerk-based authentication and tenant access.
- Business Onboarding: AI interview and profile creation.
- Dashboard: Operational command center.
- Analytics: Workflow, lead, task, and performance insights.
- Leads: Capture, assign, track, and update customer leads.
- Tasks: Human and AI-created operational tasks.
- Workflows: Business process definitions.
- Workflow Builder: Natural language to workflow JSON.
- Workflow Engine: Reads workflow JSON, executes steps, handles errors, handles approvals, and logs everything.
- AI Agent: Understands, reasons, chooses tools, executes through the engine, and summarizes.
- Tool Layer: External capabilities exposed as typed tools.

Example tools:

- `sendEmail()`
- `sendWhatsApp()`
- `bookMeeting()`
- `createLead()`
- `searchProperty()`
- `generateInvoice()`
- `notifyOwner()`
- `createTask()`
- `updateCRM()`

No external integration logic should be hardcoded inside the AI layer.

## AI Responsibilities

The AI must never directly manipulate databases.

The AI only decides. The Execution Engine performs actions.

Flow:

1. User prompt
2. LLM
3. Structured action plan
4. Execution Engine
5. Tools
6. Result

## Voice AI

Customer call flow:

1. Customer calls.
2. Voice agent answers.
3. Speech is converted to text.
4. LLM extracts intent.
5. Lead is created.
6. Appointment is scheduled.
7. WhatsApp message is sent.
8. Transcript is stored.

## Workflow Structure

Every workflow has:

- Trigger
- Condition
- Actions
- Fallback
- Approval
- Completion

Example:

```text
WHEN New Lead
IF Budget > INR 1 Crore
THEN Assign Senior Agent
AND Notify Owner
AND Schedule Visit
AND Send Brochure
```

## Execution Engine

The Execution Engine is custom-built.

Responsibilities:

- Read workflow definitions.
- Evaluate conditions.
- Execute tools.
- Pause and resume.
- Retry failed steps.
- Handle errors.
- Record logs.
- Request and process approvals.

## Integrations

Phase 1:

- Google
- Gmail
- Calendar
- WhatsApp

Phase 2:

- Zoho
- HubSpot
- Shopify
- Stripe
- Razorpay
- Twilio
- Slack
- Notion

## Multi-Tenant Architecture

Each business has its own:

- Database records
- Integrations
- OAuth tokens
- Workflows
- Employees

Hermes never uses developer-owned customer accounts. Everything belongs to the customer.

## Technology Stack

Frontend:

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend:

- NestJS
- TypeScript

Database and persistence:

- PostgreSQL
- Prisma
- Redis
- BullMQ

Realtime:

- Socket.IO

AI:

- Gemini 2.5 Pro

Voice:

- Vapi

Storage:

- Cloudinary

Deployment:

- Docker
- DigitalOcean VPS
- PM2

## Folder Architecture

```text
apps/
  web/
  api/
packages/
  ui/
  ai/
  workflow-engine/
  integrations/
  shared/
docs/
prisma/
```

The repository should use Turborepo.

## Coding Principles

Everything should be:

- Modular
- Reusable
- Scalable
- Typed
- Testable
- Feature-based

Avoid duplicated logic.

## UI Style

The UI should feel like a modern SaaS product inspired by Linear, Vercel, Notion, and Stripe Dashboard.

Style direction:

- Minimal
- Professional
- Dark mode first
- Operational and dashboard-focused

## Workflow Philosophy

AI never directly executes. AI always identifies the required tool or action. The Execution Engine executes the tool.

This keeps the system secure, auditable, and scalable.

## Security

Core security requirements:

- OAuth
- Encrypted tokens
- RBAC
- Tenant isolation
- Rate limiting
- Audit logs
- No secrets in frontend code

## Demo Flow

Hackathon demo:

1. Judge calls the AI.
2. AI collects customer details.
3. Lead appears instantly.
4. AI assigns sales agent.
5. Site visit is scheduled.
6. WhatsApp confirmation is sent.
7. Dashboard updates live.
8. Workflow log is displayed.

This should demonstrate the full platform in under three minutes.

## Future Roadmap

- Visual drag-and-drop workflow builder
- Multi-agent collaboration
- Voice-based workflow creation
- AI-generated dashboards
- Integration marketplace
- Mobile app
- AI business analytics
- Industry-specific templates

## Project Rules

These rules guide every coding decision:

- Never hardcode business logic.
- Every external capability is a Tool.
- Every business is isolated.
- AI decides; the Execution Engine executes.
- New industries should require only new tools and templates, not changes to the core engine.
- Build production-quality code, even if the MVP supports only a few integrations.
- Every feature must support scalability and future SaaS deployment.

## Development Roadmap

- Phase 1: Foundation
- Phase 2: AI Core
- Phase 3: Workflow Engine
- Phase 4: Integrations
- Phase 5: Real Estate Demo
- Phase 6: Polish
