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

## Workflow Implementation Guidelines

When adding or updating workflow components:

1. **DTO Validations**: Implement class-validator annotations on request DTOs. For programmatic controller validation checks, always support plain JavaScript inputs inside static `validate` functions by instantiating the class using `Object.assign(new DtoClass(), plainObject)` before calling `validateSync()`.
2. **Deterministic Validation**: Keep the `WorkflowDefinitionValidator` completely stateless and independent of database or network calls.
3. **Optimistic Locking**: Every mutation API request must contain the current expected `revision` counter, checking it against the current database state before modifying parent records.
4. **Tenant Scoping**: All database reads, writes, and soft deletion flags must explicitly specify `tenantId`. Never run unscoped operations.
5. **Cascading Relational Writes**: Wrap projection generation (triggers, steps, variables) and parent workflow updates inside a database transaction (`prisma.$transaction`) to ensure atomic execution.
6. **Immutable Published Versions**: Once a version's status shifts to `PUBLISHED`, its definition must remain frozen. Further configuration changes must initialize the next incremented version draft.
