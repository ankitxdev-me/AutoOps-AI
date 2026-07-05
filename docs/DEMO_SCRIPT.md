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
