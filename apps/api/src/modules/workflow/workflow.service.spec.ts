import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowService } from './workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowDefinitionValidator } from './workflow-definition-validator.service';
import { WorkflowStatus, WorkflowVersionStatus } from '@prisma/client';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('WorkflowService', () => {
  let service: WorkflowService;

  const mockFindUniqueWorkflow = jest.fn();
  const mockFindFirstWorkflow = jest.fn();
  const mockFindManyWorkflows = jest.fn();
  const mockCreateWorkflow = jest.fn();
  const mockUpdateWorkflow = jest.fn();

  const mockFindFirstWorkflowVersion = jest.fn();
  const mockCreateWorkflowVersion = jest.fn();
  const mockUpdateWorkflowVersion = jest.fn();
  const mockUpdateManyWorkflowVersions = jest.fn();

  const mockDeleteManyTriggers = jest.fn();
  const mockCreateTrigger = jest.fn();

  const mockDeleteManySteps = jest.fn();
  const mockCreateStep = jest.fn();

  const mockDeleteManyVariables = jest.fn();
  const mockCreateVariable = jest.fn();

  const mockPrisma = {
    workflow: {
      findUnique: mockFindUniqueWorkflow,
      findFirst: mockFindFirstWorkflow,
      findMany: mockFindManyWorkflows,
      create: mockCreateWorkflow,
      update: mockUpdateWorkflow,
    },
    workflowVersion: {
      findFirst: mockFindFirstWorkflowVersion,
      create: mockCreateWorkflowVersion,
      update: mockUpdateWorkflowVersion,
      updateMany: mockUpdateManyWorkflowVersions,
    },
    workflowTrigger: {
      deleteMany: mockDeleteManyTriggers,
      create: mockCreateTrigger,
    },
    workflowStep: {
      deleteMany: mockDeleteManySteps,
      create: mockCreateStep,
    },
    workflowVariable: {
      deleteMany: mockDeleteManyVariables,
      create: mockCreateVariable,
    },
    $transaction: jest
      .fn()
      .mockImplementation((cb: (tx: unknown) => unknown) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        WorkflowDefinitionValidator,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enforceWritePermission', () => {
    it('should throw ForbiddenException for non-admin/non-owner roles', async () => {
      await expect(
        service.createWorkflow('tenant-1', 'MEMBER', 'user-1', {
          name: 'My Workflow',
          key: 'my-flow',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createWorkflow', () => {
    it('should throw ConflictException if duplicate key exists', async () => {
      mockFindUniqueWorkflow.mockResolvedValueOnce({ id: 'existing-id' });

      await expect(
        service.createWorkflow('tenant-1', 'ADMIN', 'user-1', {
          name: 'My Flow',
          key: 'my-flow',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully create a new draft workflow', async () => {
      mockFindUniqueWorkflow.mockResolvedValueOnce(null);
      mockCreateWorkflow.mockResolvedValueOnce({
        id: 'new-flow-id',
        name: 'My Flow',
        key: 'my-flow',
        revision: 1,
      });
      mockCreateWorkflowVersion.mockResolvedValueOnce({
        id: 'new-version-id',
        versionNumber: 1,
      });

      const result = await service.createWorkflow(
        'tenant-1',
        'OWNER',
        'user-1',
        {
          name: 'My Flow',
          key: 'my-flow',
        },
      );

      expect(result).toHaveProperty('id', 'new-flow-id');
      expect(mockCreateWorkflow).toHaveBeenCalled();
      expect(mockCreateWorkflowVersion).toHaveBeenCalled();
    });
  });

  describe('getWorkflow', () => {
    it('should throw NotFoundException if workflow does not exist', async () => {
      mockFindFirstWorkflow.mockResolvedValueOnce(null);

      await expect(
        service.getWorkflow('tenant-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return workflow details', async () => {
      mockFindFirstWorkflow.mockResolvedValueOnce({
        id: 'flow-123',
        name: 'Workflow One',
      });

      const result = await service.getWorkflow('tenant-1', 'flow-123');
      expect(result).toHaveProperty('id', 'flow-123');
    });
  });

  describe('updateWorkflow', () => {
    it('should throw ConflictException if revision is outdated', async () => {
      mockFindFirstWorkflow.mockResolvedValueOnce({
        id: 'flow-123',
        revision: 5,
      });

      await expect(
        service.updateWorkflow('tenant-1', 'ADMIN', 'flow-123', {
          name: 'Updated Name',
          revision: 4, // Outdated revision
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('publishWorkflow', () => {
    it('should run idempotent publication if latest version is already published', async () => {
      mockFindFirstWorkflow.mockResolvedValueOnce({
        id: 'flow-123',
        status: WorkflowStatus.ACTIVE,
        revision: 1,
      });
      mockFindFirstWorkflowVersion.mockResolvedValueOnce({
        id: 'ver-123',
        status: WorkflowVersionStatus.PUBLISHED,
        versionNumber: 1,
      });

      const result = await service.publishWorkflow(
        'tenant-1',
        'ADMIN',
        'flow-123',
        1,
      );

      expect(result.workflow.status).toBe(WorkflowStatus.ACTIVE);
      expect(mockCreateTrigger).not.toHaveBeenCalled();
    });

    it('should fail publishing if workflow validation checks fail', async () => {
      mockFindFirstWorkflow.mockResolvedValueOnce({
        id: 'flow-123',
        status: WorkflowStatus.DRAFT,
        revision: 1,
      });
      // Mock invalid definition schema (missing trigger)
      mockFindFirstWorkflowVersion.mockResolvedValueOnce({
        id: 'ver-123',
        status: WorkflowVersionStatus.DRAFT,
        definition: {
          actions: [],
        },
      });

      await expect(
        service.publishWorkflow('tenant-1', 'ADMIN', 'flow-123', 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should compile projections during draft publication inside transaction', async () => {
      mockFindFirstWorkflow.mockResolvedValueOnce({
        id: 'flow-123',
        status: WorkflowStatus.DRAFT,
        revision: 1,
      });
      mockFindFirstWorkflowVersion.mockResolvedValueOnce({
        id: 'ver-123',
        versionNumber: 1,
        definitionVersion: 1,
        status: WorkflowVersionStatus.DRAFT,
        definition: {
          trigger: {
            type: 'LEAD_CREATED',
            configuration: {},
          },
          actions: [
            {
              id: 'step-1',
              name: 'Call Lead',
              type: 'TOOL_CALL',
              configuration: {},
              sortOrder: 1,
            },
          ],
          variables: [
            {
              key: 'lead.phone',
              type: 'STRING',
            },
          ],
        },
        createdById: 'usr-1',
      });

      mockUpdateWorkflowVersion.mockResolvedValueOnce({
        id: 'ver-123',
        status: WorkflowVersionStatus.PUBLISHED,
      });
      mockUpdateWorkflow.mockResolvedValueOnce({
        id: 'flow-123',
        status: WorkflowStatus.ACTIVE,
      });

      const result = await service.publishWorkflow(
        'tenant-1',
        'ADMIN',
        'flow-123',
        1,
      );

      expect(result.workflow.status).toBe(WorkflowStatus.ACTIVE);
      expect(mockDeleteManyTriggers).toHaveBeenCalled();
      expect(mockCreateTrigger).toHaveBeenCalled();
      expect(mockCreateStep).toHaveBeenCalled();
      expect(mockCreateVariable).toHaveBeenCalled();
    });
  });
});
