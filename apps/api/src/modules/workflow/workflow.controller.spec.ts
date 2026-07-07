import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { TenantRequiredGuard } from '../../common/guards/tenant-required.guard';

describe('WorkflowController', () => {
  let controller: WorkflowController;

  const mockWorkflowService = {
    createWorkflow: jest.fn(),
    listWorkflows: jest.fn(),
    getWorkflow: jest.fn(),
    updateWorkflow: jest.fn(),
    deleteWorkflow: jest.fn(),
    publishWorkflow: jest.fn(),
    pauseWorkflow: jest.fn(),
    resumeWorkflow: jest.fn(),
    archiveWorkflow: jest.fn(),
  };

  const mockAuthGuard = { canActivate: jest.fn(() => true) };
  const mockTenantContextGuard = { canActivate: jest.fn(() => true) };
  const mockTenantRequiredGuard = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowController],
      providers: [{ provide: WorkflowService, useValue: mockWorkflowService }],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(TenantContextGuard)
      .useValue(mockTenantContextGuard)
      .overrideGuard(TenantRequiredGuard)
      .useValue(mockTenantRequiredGuard)
      .compile();

    controller = module.get<WorkflowController>(WorkflowController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call workflowService.createWorkflow', async () => {
      const mockContext = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        role: 'ADMIN',
      };
      const mockDto = {
        name: 'Lead Router',
        key: 'lead-router',
      };
      mockWorkflowService.createWorkflow.mockResolvedValueOnce({
        id: 'flow-123',
        name: 'Lead Router',
      });

      const result = await controller.create(mockContext, mockDto);

      expect(result).toEqual({
        success: true,
        data: { id: 'flow-123', name: 'Lead Router' },
      });
      expect(mockWorkflowService.createWorkflow).toHaveBeenCalledWith(
        'tenant-123',
        'ADMIN',
        'user-123',
        mockDto,
      );
    });
  });

  describe('findAll', () => {
    it('should call workflowService.listWorkflows', async () => {
      const mockContext = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        role: 'MEMBER',
      };
      mockWorkflowService.listWorkflows.mockResolvedValueOnce({
        workflows: [],
        nextCursor: null,
      });

      const result = await controller.findAll(mockContext, undefined, '10');

      expect(result).toEqual({
        success: true,
        data: { workflows: [], nextCursor: null },
      });
      expect(mockWorkflowService.listWorkflows).toHaveBeenCalledWith(
        'tenant-123',
        undefined,
        10,
      );
    });
  });

  describe('findOne', () => {
    it('should call workflowService.getWorkflow', async () => {
      const mockContext = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        role: 'MEMBER',
      };
      mockWorkflowService.getWorkflow.mockResolvedValueOnce({
        id: 'flow-123',
      });

      const result = await controller.findOne(mockContext, 'flow-123');

      expect(result).toEqual({
        success: true,
        data: { id: 'flow-123' },
      });
      expect(mockWorkflowService.getWorkflow).toHaveBeenCalledWith(
        'tenant-123',
        'flow-123',
      );
    });
  });

  describe('update', () => {
    it('should call workflowService.updateWorkflow', async () => {
      const mockContext = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        role: 'OWNER',
      };
      const mockDto = {
        name: 'Updated Name',
        revision: 2,
      };
      mockWorkflowService.updateWorkflow.mockResolvedValueOnce({
        id: 'flow-123',
        revision: 3,
      });

      const result = await controller.update(mockContext, 'flow-123', mockDto);

      expect(result).toEqual({
        success: true,
        data: { id: 'flow-123', revision: 3 },
      });
      expect(mockWorkflowService.updateWorkflow).toHaveBeenCalledWith(
        'tenant-123',
        'OWNER',
        'flow-123',
        mockDto,
      );
    });
  });

  describe('remove', () => {
    it('should call workflowService.deleteWorkflow', async () => {
      const mockContext = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        role: 'ADMIN',
      };
      mockWorkflowService.deleteWorkflow.mockResolvedValueOnce({
        id: 'flow-123',
        deletedAt: new Date(),
      });

      const result = await controller.remove(mockContext, 'flow-123');

      expect(result.success).toBe(true);
      expect(mockWorkflowService.deleteWorkflow).toHaveBeenCalledWith(
        'tenant-123',
        'ADMIN',
        'flow-123',
      );
    });
  });

  describe('publish', () => {
    it('should call workflowService.publishWorkflow', async () => {
      const mockContext = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        role: 'ADMIN',
      };
      const mockDto = { revision: 1 };
      mockWorkflowService.publishWorkflow.mockResolvedValueOnce({
        workflow: { id: 'flow-123', status: 'ACTIVE' },
      });

      const result = await controller.publish(mockContext, 'flow-123', mockDto);

      expect(result.success).toBe(true);
      expect(mockWorkflowService.publishWorkflow).toHaveBeenCalledWith(
        'tenant-123',
        'ADMIN',
        'flow-123',
        1,
      );
    });
  });
});
