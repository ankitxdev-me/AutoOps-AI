# Demo Script

## Goal

Demonstrate AutoOps AI as an AI Business Operating System for a real estate business in under three minutes.

## Demo Setup

Prepare:

- Demo real estate tenant.
- Connected WhatsApp sandbox or mocked provider.
- Connected Google Calendar sandbox or mocked provider.
- Vapi voice number or simulated call webhook.
- Dashboard open on leads and workflow logs.
- Workflow already activated for new real estate leads.

## Demo Flow

### 1. Customer Calls AI

The judge calls the AI voice agent.

The AI collects:

- Name
- Phone number
- Desired location
- Budget
- Property type
- Preferred site visit time

### 2. Lead Appears Instantly

The dashboard receives a realtime `lead.created` event.

Show:

- Lead name
- Budget
- Source as voice call
- Call transcript summary

### 3. Workflow Starts

The workflow log shows:

- Trigger received
- Conditions evaluated
- Lead matched high-budget rule

### 4. Sales Agent Assigned

The workflow engine executes `assignAgent`.

Show:

- Assigned senior agent
- Task created for follow-up

### 5. Site Visit Scheduled

The engine executes `bookMeeting`.

Show:

- Calendar event created
- Visit date and time

### 6. WhatsApp Confirmation Sent

The engine executes `sendWhatsApp`.

Show:

- Confirmation message status
- Provider message ID or mocked delivery status

### 7. Workflow Completes

The dashboard shows:

- Workflow completed
- Steps completed
- Total execution time
- Full audit trail

## Suggested Demo Narration

```text
This is AutoOps AI, an AI Business Operating System.

Instead of forcing a business owner to configure complex automation rules, AutoOps learns how the business works and turns natural language into secure executable workflows.

In this real estate demo, a customer calls the AI. The AI captures the lead, the workflow engine assigns an agent, schedules a site visit, sends WhatsApp confirmation, and logs every step.

The key design principle is that AI does not directly execute business actions. AI decides what should happen. The execution engine validates and runs tools securely.
```

## Success Criteria

- The full demo finishes under three minutes.
- Dashboard updates live.
- Workflow log is visible and understandable.
- The AI/execution boundary is clear.
- The demo proves real operational value, not only chat.

---

## Sprint 2 Demo Flow: Tenant Creation & Team Management

This is the finalized walkthrough for showcasing the Sprint 2 milestone:

### Step 1: User Signup & Authentication

1. Navigate to `/` and click **Get Started** or **Sign In**.
2. Authenticate securely via **Clerk**.

### Step 2: Tenant Shell Initialization

1. If the user does not have a business, they are redirected to `/business/create`.
2. Input the business name, industry (e.g. _Real Estate_), and country, and click **Create Business**.
3. The user is automatically registered as the **OWNER** of the new tenant.

### Step 3: Server-Guarded Onboarding Interview

1. The user undergoes the **AI Onboarding Step Wizard** at `/onboarding`.
2. Answer the onboarding questions to finalize the company details.
3. Confirm the profile draft to move the tenant state to **active** and unlock the workspace console.

### Step 4: Workspace Configuration

1. Go to **Business Profile** (`/business/profile`) and update localization or contact details.
2. Go to **Business Settings** (`/business/settings`) and configure currency, timezone, and business operating hours.

### Step 5: Member Management & Access Control

1. Click **Team Members** (`/business/members`) to invite a new user (role: `ADMIN` or `MEMBER`).
2. Observe the pending invitation appear in the **Pending Invitations** list.
3. Click **Resend** to refresh the invitation timestamp or click **Cancel** to cancel the invite instantly.
4. Promote/demote members (transitions: `MEMBER` ⇄ `ADMIN`) via the role selector dropdown (guarded by confirmation dialogs and automatic rollback on network failure).
5. Click **Remove** to delete a member from the database securely.

### Step 6: Live Dashboard Analytics

1. Navigate to the **Dashboard** (`/dashboard`).
2. Observe live statistics: **Total Active Members**, **Pending Invites**, **Business Created Date**, **Business Name**, and **Industry** populated dynamically from server data.
3. Observe future sprint targets (Running Workflows, AI Agents) default to `0`.
4. Monitor the dynamic **Recent Workspace Activity Feed** updating in real time as profile updates, settings modifications, invites, role transitions, or removals occur.

---

## Sprint 3.1 Demo Flow: Workflow Foundation

This script showcases the creation, versioning, validation, and lifecycle management APIs completed in Sprint 3.1:

### Step 1: Create a Workflow

1. Call `POST /workflows` passing a new workflow key, name, and description.
2. The system executes a database transaction to:
   - Create the parent `Workflow` record (revision: `1`, status: `DRAFT`).
   - Create the first `WorkflowVersion` draft record (versionNumber: `1`, status: `DRAFT`).
3. Verify that the parent workflow and version history are initialized correctly.

### Step 2: Edit the Draft Definition

1. Call `PATCH /workflows/:id` with a `definition` JSON payload and the current `revision` (value: `1`).
2. The definition contains triggers, actions, and fallback blocks.
3. The system checks the revision (concurrency control) and updates the draft version definition. The parent workflow revision increments to `2`.

### Step 3: Trigger-Based Publication

1. Call `POST /workflows/:id/publish` with the current `revision` (value: `2`).
2. The system executes the `WorkflowDefinitionValidator` to check for trigger type compliance, unique action IDs, valid operators, and cross-references.
3. Once validated, a Prisma database transaction:
   - Freezes `WorkflowVersion` 1 status to `PUBLISHED`.
   - Parses the JSON definition and projects database records for trigger indexing (`WorkflowTrigger`), steps sequencing (`WorkflowStep`), and placeholder variables (`WorkflowVariable`).
   - Activates the workflow: sets status to `ACTIVE` and links `activeVersionId` to version 1.
   - Automatically initializes the next draft `WorkflowVersion` 2 with versionNumber `2` and status `DRAFT` for future changes.

### Step 4: Pause and Resume

1. Call `POST /workflows/:id/pause` with the current `revision` (value: `3`). The workflow status shifts to `PAUSED`.
2. Call `POST /workflows/:id/resume` with the current `revision` (value: `4`). The status returns to `ACTIVE`.

### Step 5: Archiving and Terminal States

1. Call `POST /workflows/:id/archive` with the current `revision` (value: `5`).
2. The system moves the workflow status to `ARCHIVED` and bulk-updates all associated version draft states to `ARCHIVED`.
3. Try calling any modification API (e.g. Pause, Update) on this archived workflow. Verify that the transition is rejected with `BadRequestException` as archived states are terminal.

### What is Intentionally Out of Scope for Sprint 3.1

- **Event Dispatching & Execution**: Auto-matching inbound CRM events (like `lead.created`) to workflows and runner-step execution belongs to **Sprint 3.2**.
- **Visual Graph Builder**: The drag-and-drop workflow graph editing canvas on the Next.js frontend belongs to **Sprint 4**.
- **AI Parser Conversational Node**: Generating definition JSONs through real-time Gemini prompts belongs to **Sprint 5**.
