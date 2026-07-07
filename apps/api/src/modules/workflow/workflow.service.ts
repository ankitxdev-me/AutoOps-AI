import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import type { WorkflowDefinition } from './interfaces/workflow-definition.interface';
import { WorkflowDefinitionValidator } from './workflow-definition-validator.service';
import {
  WorkflowStatus,
  WorkflowVersionStatus,
  WorkflowTriggerType,
  WorkflowVariableType,
  WorkflowStepType,
} from '@prisma/client';

@Injectable()
export class WorkflowService {
  constructor(
    private prisma: PrismaService,
    private validator: WorkflowDefinitionValidator,
  ) {}

  // Enforces RBAC permissions: only OWNER and ADMIN can write/mutate workflows
  private enforceWritePermission(callerRole: string) {
    if (callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Only OWNER and ADMIN roles are authorized to modify workflows.',
      );
    }
  }

  // Normalizes events (like "lead.created") to prisma database enums (like "LEAD_CREATED")
  private normalizeTriggerType(type: string): WorkflowTriggerType {
    if (!type) return WorkflowTriggerType.MANUAL_RUN;
    const normalized = type.toUpperCase().replace(/\./g, '_');
    if (
      Object.values(WorkflowTriggerType).includes(
        normalized as WorkflowTriggerType,
      )
    ) {
      return normalized as WorkflowTriggerType;
    }
    return WorkflowTriggerType.MANUAL_RUN;
  }

  // Normalizes action types to prisma database enums
  private normalizeStepType(type: string): WorkflowStepType {
    if (!type) return WorkflowStepType.TOOL_CALL;
    const normalized = type.toUpperCase();
    if (
      Object.values(WorkflowStepType).includes(normalized as WorkflowStepType)
    ) {
      return normalized as WorkflowStepType;
    }
    return WorkflowStepType.TOOL_CALL;
  }

  // Normalizes variable types to prisma database enums
  private normalizeVariableType(type: string): WorkflowVariableType {
    if (!type) return WorkflowVariableType.STRING;
    const normalized = type.toUpperCase();
    if (
      Object.values(WorkflowVariableType).includes(
        normalized as WorkflowVariableType,
      )
    ) {
      return normalized as WorkflowVariableType;
    }
    return WorkflowVariableType.STRING;
  }

  // Validates state transitions based on the workflow state machine
  private validateTransition(current: WorkflowStatus, next: WorkflowStatus) {
    if (current === WorkflowStatus.ARCHIVED) {
      throw new BadRequestException(
        'An archived workflow is in a terminal state and cannot transition to any other status.',
      );
    }
    if (current === WorkflowStatus.DRAFT && next === WorkflowStatus.PAUSED) {
      throw new BadRequestException(
        'A draft workflow cannot be paused directly. It must be published first.',
      );
    }
  }

  async createWorkflow(
    tenantId: string,
    callerRole: string,
    userId: string,
    dto: CreateWorkflowDto,
  ) {
    this.enforceWritePermission(callerRole);

    const existing = await this.prisma.workflow.findUnique({
      where: { key: dto.key },
    });
    if (existing) {
      throw new ConflictException(
        `A workflow with key '${dto.key}' already exists.`,
      );
    }

    const defaultDefinition: WorkflowDefinition =
      (dto.definition as unknown as WorkflowDefinition) || {
        trigger: { type: WorkflowTriggerType.MANUAL_RUN },
        conditions: [],
        actions: [],
        fallback: {},
      };

    // Save parent workflow and create initial draft version inside a transaction
    return this.prisma.$transaction(async (tx) => {
      const workflow = await tx.workflow.create({
        data: {
          tenantId,
          key: dto.key,
          name: dto.name,
          description: dto.description,
          category: dto.category,
          status: WorkflowStatus.DRAFT,
          createdBy: userId,
          revision: 1,
          metadata: dto.metadata || {},
        },
      });

      const version = await tx.workflowVersion.create({
        data: {
          workflowId: workflow.id,
          versionNumber: 1,
          definitionVersion: 1,
          status: WorkflowVersionStatus.DRAFT,
          definition:
            defaultDefinition as unknown as import('@prisma/client/runtime/library').InputJsonValue,
          createdById: userId,
        },
      });

      return {
        ...workflow,
        versions: [version],
      };
    });
  }

  async listWorkflows(tenantId: string, cursor?: string, limit = 20) {
    const workflows = await this.prisma.workflow.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        activeVersion: true,
      },
    });

    let nextCursor: string | null = null;
    if (workflows.length > limit) {
      const nextItem = workflows.pop();
      nextCursor = nextItem?.id || null;
    }

    return { workflows, nextCursor };
  }

  async getWorkflow(tenantId: string, id: string) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
        activeVersion: true,
      },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found.');
    }

    return workflow;
  }

  async updateWorkflow(
    tenantId: string,
    callerRole: string,
    id: string,
    dto: UpdateWorkflowDto,
  ) {
    this.enforceWritePermission(callerRole);

    const workflow = await this.prisma.workflow.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found.');
    }

    if (workflow.revision !== dto.revision) {
      throw new ConflictException(
        'The workflow revision is outdated. Another user has modified this workflow.',
      );
    }

    const latestVersion = await this.prisma.workflowVersion.findFirst({
      where: { workflowId: id },
      orderBy: { versionNumber: 'desc' },
    });

    return this.prisma.$transaction(async (tx) => {
      // If we are updating definition payload and latest version is DRAFT, update it
      if (
        dto.definition &&
        latestVersion &&
        latestVersion.status === WorkflowVersionStatus.DRAFT
      ) {
        await tx.workflowVersion.update({
          where: { id: latestVersion.id },
          data: {
            definition:
              dto.definition as unknown as import('@prisma/client/runtime/library').InputJsonValue,
          },
        });
      } else if (dto.definition) {
        // If latest version is already published, throw error as changes require next draft
        throw new BadRequestException(
          'The current version is published and frozen. You must create a new draft version to edit definition changes.',
        );
      }

      return tx.workflow.update({
        where: { id },
        data: {
          name: dto.name ?? workflow.name,
          description: dto.description ?? workflow.description,
          category: dto.category ?? workflow.category,
          metadata: dto.metadata ?? workflow.metadata ?? {},
          revision: workflow.revision + 1,
        },
      });
    });
  }

  async deleteWorkflow(tenantId: string, callerRole: string, id: string) {
    this.enforceWritePermission(callerRole);

    const workflow = await this.prisma.workflow.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found.');
    }

    return this.prisma.workflow.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async publishWorkflow(
    tenantId: string,
    callerRole: string,
    id: string,
    revision: number,
  ) {
    this.enforceWritePermission(callerRole);

    const workflow = await this.prisma.workflow.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found.');
    }

    if (workflow.revision !== revision) {
      throw new ConflictException(
        'The workflow revision is outdated. Please reload.',
      );
    }

    this.validateTransition(workflow.status, WorkflowStatus.ACTIVE);

    const latestVersion = await this.prisma.workflowVersion.findFirst({
      where: { workflowId: id },
      orderBy: { versionNumber: 'desc' },
      include: {
        steps: true,
      },
    });

    if (!latestVersion) {
      throw new BadRequestException(
        'No version associated with this workflow.',
      );
    }

    // Idempotent publish verification
    if (latestVersion.status === WorkflowVersionStatus.PUBLISHED) {
      if (workflow.status !== WorkflowStatus.ACTIVE) {
        const updatedWorkflow = await this.prisma.workflow.update({
          where: { id },
          data: {
            status: WorkflowStatus.ACTIVE,
            activeVersionId: latestVersion.id,
            revision: workflow.revision + 1,
          },
        });
        return { workflow: updatedWorkflow, version: latestVersion };
      }
      return { workflow, version: latestVersion };
    }

    const definition =
      latestVersion.definition as unknown as WorkflowDefinition;

    // Validate the definition layout before freezing status or creating projection indices
    const validationResult = this.validator.validate(definition);
    if (!validationResult.isValid) {
      const errorMsg = validationResult.errors
        .map(
          (err) =>
            `[${err.code}] ${err.path.join('.') || 'root'}: ${err.message}`,
        )
        .join('; ');
      throw new BadRequestException(
        `Workflow definition validation failed: ${errorMsg}`,
      );
    }

    const triggerDef = definition.trigger;
    const actions = definition.actions || [];
    const variables = definition.variables || [];

    return this.prisma.$transaction(async (tx) => {
      // 1. Freeze current draft version status
      const publishedVersion = await tx.workflowVersion.update({
        where: { id: latestVersion.id },
        data: {
          status: WorkflowVersionStatus.PUBLISHED,
        },
      });

      // 2. Wipe existing projections to guarantee idempotency
      await tx.workflowTrigger.deleteMany({
        where: { workflowVersionId: latestVersion.id },
      });
      await tx.workflowStep.deleteMany({
        where: { workflowVersionId: latestVersion.id },
      });
      await tx.workflowVariable.deleteMany({
        where: { workflowVersionId: latestVersion.id },
      });

      // 3. Project Workflow Trigger
      if (triggerDef && triggerDef.type) {
        await tx.workflowTrigger.create({
          data: {
            workflowVersionId: latestVersion.id,
            triggerType: this.normalizeTriggerType(triggerDef.type),
            configuration: triggerDef.configuration || {},
          },
        });
      }

      // 4. Project Workflow Steps
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        await tx.workflowStep.create({
          data: {
            workflowVersionId: latestVersion.id,
            sequence: i + 1,
            sortOrder:
              typeof action.sortOrder === 'number' ? action.sortOrder : i + 1,
            type: this.normalizeStepType(action.type),
            name: action.id || `step-${i + 1}`,
            displayName: action.name || action.id || `Step ${i + 1}`,
            metadata: action.configuration || {},
          },
        });
      }

      // 5. Project Workflow Variables
      for (const variable of variables) {
        if (variable.key && variable.type) {
          await tx.workflowVariable.create({
            data: {
              workflowVersionId: latestVersion.id,
              key: variable.key,
              type: this.normalizeVariableType(variable.type),
              defaultValue: (variable.defaultValue ??
                null) as unknown as import('@prisma/client/runtime/library').InputJsonValue,
            },
          });
        }
      }

      // 6. Link published version as active, update workflow status, increment revision
      const updatedWorkflow = await tx.workflow.update({
        where: { id },
        data: {
          status: WorkflowStatus.ACTIVE,
          activeVersionId: latestVersion.id,
          revision: workflow.revision + 1,
        },
      });

      // 7. Auto-initialize next draft version as incremented version
      await tx.workflowVersion.create({
        data: {
          workflowId: id,
          versionNumber: latestVersion.versionNumber + 1,
          definitionVersion: latestVersion.definitionVersion,
          status: WorkflowVersionStatus.DRAFT,
          definition:
            definition as unknown as import('@prisma/client/runtime/library').InputJsonValue,
          createdById: publishedVersion.createdById,
        },
      });

      return {
        workflow: updatedWorkflow,
        version: publishedVersion,
      };
    });
  }

  async pauseWorkflow(
    tenantId: string,
    callerRole: string,
    id: string,
    revision: number,
  ) {
    this.enforceWritePermission(callerRole);

    const workflow = await this.prisma.workflow.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found.');
    }

    if (workflow.revision !== revision) {
      throw new ConflictException(
        'The workflow revision is outdated. Please reload.',
      );
    }

    this.validateTransition(workflow.status, WorkflowStatus.PAUSED);

    return this.prisma.workflow.update({
      where: { id },
      data: {
        status: WorkflowStatus.PAUSED,
        revision: workflow.revision + 1,
      },
    });
  }

  async resumeWorkflow(
    tenantId: string,
    callerRole: string,
    id: string,
    revision: number,
  ) {
    this.enforceWritePermission(callerRole);

    const workflow = await this.prisma.workflow.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found.');
    }

    if (workflow.revision !== revision) {
      throw new ConflictException(
        'The workflow revision is outdated. Please reload.',
      );
    }

    this.validateTransition(workflow.status, WorkflowStatus.ACTIVE);

    return this.prisma.workflow.update({
      where: { id },
      data: {
        status: WorkflowStatus.ACTIVE,
        revision: workflow.revision + 1,
      },
    });
  }

  async archiveWorkflow(
    tenantId: string,
    callerRole: string,
    id: string,
    revision: number,
  ) {
    this.enforceWritePermission(callerRole);

    const workflow = await this.prisma.workflow.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found.');
    }

    if (workflow.revision !== revision) {
      throw new ConflictException(
        'The workflow revision is outdated. Please reload.',
      );
    }

    this.validateTransition(workflow.status, WorkflowStatus.ARCHIVED);

    return this.prisma.$transaction(async (tx) => {
      // Archive parent
      const updatedWorkflow = await tx.workflow.update({
        where: { id },
        data: {
          status: WorkflowStatus.ARCHIVED,
          revision: workflow.revision + 1,
        },
      });

      // Archive versions
      await tx.workflowVersion.updateMany({
        where: { workflowId: id },
        data: {
          status: WorkflowVersionStatus.ARCHIVED,
        },
      });

      return updatedWorkflow;
    });
  }
}
