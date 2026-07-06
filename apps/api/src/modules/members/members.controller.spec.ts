import { Test, TestingModule } from '@nestjs/testing';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { TenantRequiredGuard } from '../../common/guards/tenant-required.guard';
import {
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { EmployeeRole } from '@prisma/client';

const mockTenantContext = {
  userId: 'usr_123',
  tenantId: 'tenant_123',
  employeeId: 'emp_123',
  role: 'OWNER' as const,
  tenantName: 'Zenith Properties',
};

describe('MembersController', () => {
  let controller: MembersController;

  const mockMembersService = {
    listMembers: jest.fn(),
    inviteMember: jest.fn(),
    listInvitations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembersController],
      providers: [{ provide: MembersService, useValue: mockMembersService }],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantContextGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantRequiredGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MembersController>(MembersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listMembers', () => {
    it('should call listMembers service with tenant context', async () => {
      const mockResult = { items: [], nextCursor: null, hasNextPage: false };
      mockMembersService.listMembers.mockResolvedValueOnce(mockResult);

      const result = await controller.listMembers(mockTenantContext);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockMembersService.listMembers).toHaveBeenCalledWith(
        'tenant_123',
        undefined,
        20,
        undefined,
      );
    });

    it('should parse cursor and limit from query params', async () => {
      const mockResult = { items: [], nextCursor: null, hasNextPage: false };
      mockMembersService.listMembers.mockResolvedValueOnce(mockResult);

      await controller.listMembers(
        mockTenantContext,
        'cursor_abc',
        '10',
        'alice',
      );

      expect(mockMembersService.listMembers).toHaveBeenCalledWith(
        'tenant_123',
        'cursor_abc',
        10,
        'alice',
      );
    });
  });

  describe('inviteMember', () => {
    it('should throw BadRequestException when email is missing', async () => {
      await expect(
        controller.inviteMember(mockTenantContext, {
          email: '',
          firstName: 'Alice',
          lastName: 'Smith',
          role: EmployeeRole.MEMBER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid email', async () => {
      await expect(
        controller.inviteMember(mockTenantContext, {
          email: 'not-an-email',
          firstName: 'Alice',
          lastName: 'Smith',
          role: EmployeeRole.MEMBER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when firstName is missing', async () => {
      await expect(
        controller.inviteMember(mockTenantContext, {
          email: 'alice@test.com',
          firstName: '',
          lastName: 'Smith',
          role: EmployeeRole.MEMBER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when lastName is missing', async () => {
      await expect(
        controller.inviteMember(mockTenantContext, {
          email: 'alice@test.com',
          firstName: 'Alice',
          lastName: '',
          role: EmployeeRole.MEMBER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when role is OWNER', async () => {
      await expect(
        controller.inviteMember(mockTenantContext, {
          email: 'alice@test.com',
          firstName: 'Alice',
          lastName: 'Smith',
          role: EmployeeRole.OWNER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should propagate ForbiddenException from service when MEMBER tries to invite', async () => {
      mockMembersService.inviteMember.mockRejectedValueOnce(
        new ForbiddenException('Only OWNER or ADMIN members may invite'),
      );

      await expect(
        controller.inviteMember(
          { ...mockTenantContext, role: 'MEMBER' },
          {
            email: 'alice@test.com',
            firstName: 'Alice',
            lastName: 'Smith',
            role: EmployeeRole.MEMBER,
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should propagate ConflictException from service on duplicate', async () => {
      mockMembersService.inviteMember.mockRejectedValueOnce(
        new ConflictException('A pending invitation already exists'),
      );

      await expect(
        controller.inviteMember(mockTenantContext, {
          email: 'alice@test.com',
          firstName: 'Alice',
          lastName: 'Smith',
          role: EmployeeRole.MEMBER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should call service inviteMember with normalized values and return success', async () => {
      const mockInvitation = {
        id: 'inv_123',
        tenantId: 'tenant_123',
        email: 'alice@test.com',
        firstName: 'Alice',
        lastName: 'Smith',
        role: EmployeeRole.MEMBER,
        status: 'PENDING',
      };
      mockMembersService.inviteMember.mockResolvedValueOnce(mockInvitation);

      const result = await controller.inviteMember(mockTenantContext, {
        email: 'ALICE@TEST.COM',
        firstName: '  Alice  ',
        lastName: '  Smith  ',
        role: EmployeeRole.MEMBER,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvitation);
      expect(mockMembersService.inviteMember).toHaveBeenCalledWith(
        'tenant_123',
        'OWNER',
        {
          email: 'alice@test.com',
          firstName: 'Alice',
          lastName: 'Smith',
          role: EmployeeRole.MEMBER,
        },
      );
    });
  });
});
