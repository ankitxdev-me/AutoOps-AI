# Workflow Engine

## Purpose

The Workflow Engine is the secure runtime that turns validated workflow definitions into business actions.

It reads workflow JSON, evaluates conditions, executes tools, pauses for approvals, retries failures, and logs every step.

## Core Responsibilities

- Validate workflow definitions.
- Match triggers to active workflows.
- Create workflow execution records.
- Evaluate conditions.
- Resolve workflow variables.
- Execute tools through the Tool Registry.
- Pause and resume executions.
- Handle retries.
- Request approvals.
- Store logs and outputs.
- Emit realtime dashboard events.

## Workflow Definition Shape

```json
{
  "trigger": {
    "type": "lead.created"
  },
  "conditions": [
    {
      "field": "lead.budget",
      "operator": "gte",
      "value": 10000000
    }
  ],
  "actions": [
    {
      "id": "send-confirmation",
      "tool": "sendWhatsApp",
      "input": {
        "to": "{{lead.phone}}",
        "template": "site_visit_confirmation"
      },
      "requiresApproval": false
    }
  ],
  "fallback": {
    "tool": "notifyOwner",
    "input": {
      "message": "Workflow failed."
    }
  }
}
```

## Execution States

Workflow execution statuses:

- `pending`
- `running`
- `waiting_for_approval`
- `completed`
- `failed`
- `cancelled`

Step execution statuses:

- `pending`
- `running`
- `completed`
- `failed`
- `skipped`
- `waiting_for_approval`

## Trigger System

Triggers are normalized event names.

Examples:

- `lead.created`
- `lead.updated`
- `voice.call.completed`
- `calendar.event.created`
- `task.completed`
- `manual.run`

Trigger payloads should be immutable execution inputs.

## Condition Evaluation

Conditions compare fields from the trigger payload, workflow context, or previous tool outputs.

Supported operators for MVP:

- `eq`
- `neq`
- `gt`
- `gte`
- `lt`
- `lte`
- `contains`
- `exists`

## Retry Policy

Each tool may define a default retry policy. Workflows can override retry behavior when safe.

Recommended defaults:

- Retry transient integration failures.
- Do not retry validation failures.
- Do not retry approval rejection.
- Store every retry attempt.

## Approval Handling

Any step can require approval before execution.

Approval requests must include:

- Execution ID
- Step ID
- Reason
- Approver
- Requested action
- Expiration policy

The engine resumes execution after approval.

## Logging

Log:

- Trigger payload
- Condition results
- Tool input
- Tool output
- Tool error
- Retry attempts
- Approval events
- Final status

Sensitive fields must be redacted in logs.
