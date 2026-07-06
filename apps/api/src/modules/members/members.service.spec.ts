import { Test, TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { EmployeeRole } from '@prisma/client';

describe('MembersService', () => {
  let service: MembersService;

  const mockFindManyEmployee = jest.fn();
  const mockFindUniqueUser = jest.fn();
  const mockFindFirstEmployee = jest.fn();
  const mockFindUniqueInvitation = jest.fn();
  const mockCreateInvitation = jest.fn();
  const mockUpdateInvitation = jest.fn();
  const mockFindManyInvitation = jest.fn();

  const mockPrisma = {
    employee: {
      findMany: mockFindManyEmployee,
      findFirst: mockFindFirstEmployee,
    },
    user: {
      findUnique: mockFindUniqueUser,
    },
    invitation: {
      findUnique: mockFindUniqueInvitation,
      create: mockCreateInvitation,
      update: mockUpdateInvitation,
      findMany: mockFindManyInvitation,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listMembers', () => {
    it('should return member list with pagination', async () => {
      const mockEmployees = [
        { id: 'emp_1', user: { email: 'a@test.com' } },
        { id: 'emp_2', user: { email: 'b@test.com' } },
      ];
      mockFindManyEmployee.mockResolvedValueOnce(mockEmployees);

      const result = await service.listMembers('tenant_123', undefined, 20);

      expect(result.items).toHaveLength(2);
      expect(result.hasNextPage).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('should set nextCursor when there are more items', async () => {
      const mockEmployees = Array.from({ length: 21 }, (_, i) => ({
        id: `emp_${i}`,
        user: { email: `user${i}@test.com` },
      }));
      mockFindManyEmployee.mockResolvedValueOnce(mockEmployees);

      const result = await service.listMembers('tenant_123', undefined, 20);

      expect(result.items).toHaveLength(20);
      expect(result.hasNextPage).toBe(true);
      expect(result.nextCursor).toBe('emp_19');
    });

    it('should pass search filter to Prisma query', async () => {
      mockFindManyEmployee.mockResolvedValueOnce([]);

      await service.listMembers('tenant_123', undefined, 20, 'Alice');

      expect(mockFindManyEmployee).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            user: expect.objectContaining({ OR: expect.any(Array) }),
          }),
        }),
      );
    });
  });

  describe('inviteMember', () => {
    it('should throw ForbiddenException when inviter role is MEMBER', async () => {
      await expect(
        service.inviteMember('tenant_123', 'MEMBER', {
          email: 'invite@test.com',
          firstName: 'Alice',
          lastName: 'Smith',
          role: EmployeeRole.MEMBER,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when trying to invite as OWNER', async () => {
      await expect(
        service.inviteMember('tenant_123', 'OWNER', {
          email: 'invite@test.com',
          firstName: 'Alice',
          lastName: 'Smith',
          role: EmployeeRole.OWNER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user is already an active member', async () => {
      mockFindUniqueUser.mockResolvedValueOnce({ id: 'usr_existing' });
      mockFindFirstEmployee.mockResolvedValueOnce({ id: 'emp_existing' });

      await expect(
        service.inviteMember('tenant_123', 'OWNER', {
          email: 'existing@test.com',
          firstName: 'Existing',
          lastName: 'User',
          role: EmployeeRole.MEMBER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on duplicate pending invitation', async () => {
      mockFindUniqueUser.mockResolvedValueOnce(null);
      mockFindUniqueInvitation.mockResolvedValueOnce({
        id: 'inv_1',
        status: 'PENDING',
      });

      await expect(
        service.inviteMember('tenant_123', 'OWNER', {
          email: 'pending@test.com',
          firstName: 'Bob',
          lastName: 'Jones',
          role: EmployeeRole.MEMBER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create invitation when all checks pass', async () => {
      mockFindUniqueUser.mockResolvedValueOnce(null);
      mockFindUniqueInvitation.mockResolvedValueOnce(null);

      const mockInvitation = {
        id: 'inv_new',
        tenantId: 'tenant_123',
        email: 'new@test.com',
        role: EmployeeRole.MEMBER,
        status: 'PENDING',
      };
      mockCreateInvitation.mockResolvedValueOnce(mockInvitation);

      const result = await service.inviteMember('tenant_123', 'ADMIN', {
        email: 'new@test.com',
        firstName: 'New',
        lastName: 'User',
        role: EmployeeRole.MEMBER,
      });

      expect(result).toEqual(mockInvitation);
      expect(mockCreateInvitation).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          tenantId: 'tenant_123',
          email: 'new@test.com',
          status: 'PENDING',
        }),
      });
    });

    it('should re-invite (upsert) a previously cancelled invitation', async () => {
      mockFindUniqueUser.mockResolvedValueOnce(null);
      mockFindUniqueInvitation.mockResolvedValueOnce({
        id: 'inv_old',
        status: 'CANCELLED',
      });

      const updatedInvitation = { id: 'inv_old', status: 'PENDING' };
      mockUpdateInvitation.mockResolvedValueOnce(updatedInvitation);

      const result = await service.inviteMember('tenant_123', 'OWNER', {
        email: 'old@test.com',
        firstName: 'Old',
        lastName: 'User',
        role: EmployeeRole.MEMBER,
      });

      expect(result).toEqual(updatedInvitation);
      expect(mockUpdateInvitation).toHaveBeenCalled();
    });
  });

  describe('listInvitations', () => {
    it('should return pending invitations for tenant', async () => {
      const mockInvitations = [{ id: 'inv_1', status: 'PENDING' }];
      mockFindManyInvitation.mockResolvedValueOnce(mockInvitations);

      const result = await service.listInvitations('tenant_123');
      expect(result).toEqual(mockInvitations);
      expect(mockFindManyInvitation).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant_123', status: 'PENDING' },
        }),
      );
    });
  });
});
