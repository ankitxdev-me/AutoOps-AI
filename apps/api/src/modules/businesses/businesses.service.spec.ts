import { Test, TestingModule } from '@nestjs/testing';
import { BusinessesService } from './businesses.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { EmployeeRole } from '@prisma/client';

describe('BusinessesService', () => {
  let service: BusinessesService;

  const mockFindUniqueUser = jest.fn();
  const mockFindFirstEmployee = jest.fn();
  const mockFindUniqueTenant = jest.fn();
  const mockCreateTenant = jest.fn();
  const mockCreateEmployee = jest.fn();
  const mockCreateBusinessProfile = jest.fn();
  const mockFindUniqueBusinessProfile = jest.fn();
  const mockUpdateBusinessProfile = jest.fn();

  const mockCreateBusinessSettings = jest.fn();
  const mockFindUniqueBusinessSettings = jest.fn();
  const mockUpdateBusinessSettings = jest.fn();

  const mockPrisma = {
    user: {
      findUnique: mockFindUniqueUser,
    },
    employee: {
      findFirst: mockFindFirstEmployee,
      create: mockCreateEmployee,
    },
    tenant: {
      findUnique: mockFindUniqueTenant,
      create: mockCreateTenant,
    },
    businessProfile: {
      create: mockCreateBusinessProfile,
      findUnique: mockFindUniqueBusinessProfile,
      update: mockUpdateBusinessProfile,
    },
    businessSettings: {
      create: mockCreateBusinessSettings,
      findUnique: mockFindUniqueBusinessSettings,
      update: mockUpdateBusinessSettings,
    },
    $transaction: jest
      .fn()
      .mockImplementation((cb: (tx: unknown) => unknown) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BusinessesService>(BusinessesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBusiness', () => {
    it('should throw BadRequestException if user is not synced in DB', async () => {
      mockFindUniqueUser.mockResolvedValueOnce(null);

      await expect(
        service.createBusiness('clerk_123', {
          name: 'Zenith Properties',
          industry: 'real_estate',
          country: 'IN',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user already owns a business in Sprint 2', async () => {
      mockFindUniqueUser.mockResolvedValueOnce({ id: 'usr_123' });
      mockFindFirstEmployee.mockResolvedValueOnce({ id: 'emp_123' });

      await expect(
        service.createBusiness('clerk_123', {
          name: 'Zenith Properties',
          industry: 'real_estate',
          country: 'IN',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if slug is duplicate', async () => {
      mockFindUniqueUser.mockResolvedValueOnce({ id: 'usr_123' });
      mockFindFirstEmployee.mockResolvedValueOnce(null);
      mockFindUniqueTenant.mockResolvedValueOnce({
        id: 'tenant_exist',
        slug: 'zenith-properties',
      });

      await expect(
        service.createBusiness('clerk_123', {
          name: 'Zenith Properties',
          industry: 'real_estate',
          country: 'IN',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create business, profile, settings, and owner employee in transaction', async () => {
      mockFindUniqueUser.mockResolvedValueOnce({ id: 'usr_123' });
      mockFindFirstEmployee.mockResolvedValueOnce(null);
      mockFindUniqueTenant.mockResolvedValueOnce(null);

      const mockTenant = {
        id: 'tenant_123',
        name: 'Zenith Properties',
        slug: 'zenith-properties',
        industry: 'real_estate',
        country: 'IN',
      };
      const mockEmployee = {
        id: 'emp_123',
        tenantId: 'tenant_123',
        userId: 'usr_123',
        role: EmployeeRole.OWNER,
      };

      mockCreateTenant.mockResolvedValueOnce(mockTenant);
      mockCreateEmployee.mockResolvedValueOnce(mockEmployee);
      mockCreateBusinessProfile.mockResolvedValueOnce({ id: 'profile_123' });
      mockCreateBusinessSettings.mockResolvedValueOnce({ id: 'settings_123' });

      const result = await service.createBusiness('clerk_123', {
        name: 'Zenith Properties',
        industry: 'real_estate',
        country: 'IN',
      });

      expect(result.success).toBe(true);
      expect(result.data.tenant).toEqual(mockTenant);
      expect(result.data.employee).toEqual(mockEmployee);
      expect(mockCreateBusinessProfile).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant_123',
          legalBusinessName: 'Zenith Properties',
          displayName: 'Zenith Properties',
          industry: 'real_estate',
          country: 'IN',
        },
      });
      expect(mockCreateBusinessSettings).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant_123',
          defaultCountry: 'IN',
        },
      });
    });
  });

  describe('getProfile', () => {
    it('should throw BadRequestException if profile does not exist', async () => {
      mockFindUniqueBusinessProfile.mockResolvedValueOnce(null);

      await expect(service.getProfile('tenant_not_exist')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return business profile if found', async () => {
      const mockProfile = {
        id: 'profile_123',
        tenantId: 'tenant_123',
        legalBusinessName: 'Test Legal Name',
      };
      mockFindUniqueBusinessProfile.mockResolvedValueOnce(mockProfile);

      const result = await service.getProfile('tenant_123');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('should throw BadRequestException if profile does not exist for update', async () => {
      mockFindUniqueBusinessProfile.mockResolvedValueOnce(null);

      await expect(
        service.updateProfile('tenant_not_exist', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should perform update and return new profile state', async () => {
      const mockProfile = {
        id: 'profile_123',
        tenantId: 'tenant_123',
        legalBusinessName: 'Old Name',
      };
      mockFindUniqueBusinessProfile.mockResolvedValueOnce(mockProfile);

      const updatedProfile = { ...mockProfile, legalBusinessName: 'New Name' };
      mockUpdateBusinessProfile.mockResolvedValueOnce(updatedProfile);

      const result = await service.updateProfile('tenant_123', {
        legalBusinessName: 'New Name',
      });
      expect(result).toEqual(updatedProfile);
    });
  });

  describe('getSettings', () => {
    it('should throw BadRequestException if settings do not exist', async () => {
      mockFindUniqueBusinessSettings.mockResolvedValueOnce(null);

      await expect(service.getSettings('tenant_not_exist')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return business settings if found', async () => {
      const mockSettings = {
        id: 'settings_123',
        tenantId: 'tenant_123',
        timezone: 'UTC',
      };
      mockFindUniqueBusinessSettings.mockResolvedValueOnce(mockSettings);

      const result = await service.getSettings('tenant_123');
      expect(result).toEqual(mockSettings);
    });
  });

  describe('updateSettings', () => {
    it('should throw BadRequestException if settings do not exist for update', async () => {
      mockFindUniqueBusinessSettings.mockResolvedValueOnce(null);

      await expect(
        service.updateSettings('tenant_not_exist', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update settings and return the updated values', async () => {
      const mockSettings = {
        id: 'settings_123',
        tenantId: 'tenant_123',
        timezone: 'UTC',
      };
      mockFindUniqueBusinessSettings.mockResolvedValueOnce(mockSettings);

      const updatedSettings = { ...mockSettings, timezone: 'Asia/Kolkata' };
      mockUpdateBusinessSettings.mockResolvedValueOnce(updatedSettings);

      const result = await service.updateSettings('tenant_123', {
        timezone: 'Asia/Kolkata',
      });
      expect(result).toEqual(updatedSettings);
    });
  });
});
