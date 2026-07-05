# Contributing

## Project Standards

AutoOps AI should be modular, reusable, scalable, typed, testable, and feature-based.

Core rules:

- Never hardcode business logic.
- Every external capability is a Tool.
- Every business is isolated by tenant.
- AI decides; the Execution Engine executes.
- New industries should require tools and templates, not core engine rewrites.
- No secrets in frontend code.

## Repository Structure

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

## Development Expectations

- Use TypeScript across the stack.
- Prefer shared types and schemas for API contracts.
- Keep feature logic close to its module.
- Add tests for business-critical behavior.
- Avoid duplicated logic.
- Keep tenant context explicit in backend services.
- Validate all AI-generated structured output before storage or execution.

## Security Expectations

- Never expose tokens to the frontend.
- Encrypt OAuth tokens.
- Enforce RBAC in API services.
- Scope all tenant-owned reads and writes by tenant.
- Log audit events for sensitive changes.
- Redact secrets and sensitive fields from logs.

## Documentation Expectations

Update docs when changing:

- Workflow schema
- Tool Registry
- API routes
- Database schema
- AI prompts
- Security assumptions
- Demo flow
