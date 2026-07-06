import { Test, TestingModule } from '@nestjs/testing';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { TenantRequiredGuard } from '../../common/guards/tenant-required.guard';
import { BadRequestException } from '@nestjs/common';

describe('BusinessesController', () => {
  let controller: BusinessesController;

  const mockBusinessesService = {
    createBusiness: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessesController],
      providers: [
        { provide: BusinessesService, useValue: mockBusinessesService },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .overrideGuard(TenantContextGuard)
      .useValue({
        canActivate: () => true,
      })
      .overrideGuard(TenantRequiredGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<BusinessesController>(BusinessesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if user context is missing clerkId', async () => {
      await expect(
        controller.create(undefined, {
          name: 'Zenith Properties',
          industry: 'real_estate',
          country: 'IN',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if name is missing', async () => {
      await expect(
        controller.create(
          { clerkId: 'clerk_123' },
          { name: '', industry: 'real_estate', country: 'IN' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should call service createBusiness with parsed user details', async () => {
      const body = {
        name: 'Zenith Properties',
        industry: 'real_estate',
        country: 'IN',
      };
      mockBusinessesService.createBusiness.mockResolvedValueOnce({
        success: true,
        data: { id: 'tenant_123' },
      });

      const result = await controller.create({ clerkId: 'clerk_123' }, body);
      expect(result.success).toBe(true);
      expect(mockBusinessesService.createBusiness).toHaveBeenCalledWith(
        'clerk_123',
        body,
      );
    });
  });

  describe('getProfile', () => {
    it('should call getProfile service and return payload', async () => {
      const mockProfile = { id: 'profile_123', tenantId: 'tenant_123' };
      mockBusinessesService.getProfile.mockResolvedValueOnce(mockProfile);

      const result = await controller.getProfile({
        userId: 'usr_123',
        tenantId: 'tenant_123',
        employeeId: 'emp_123',
        role: 'OWNER',
        tenantName: 'Zenith Properties',
      });

      expect(result).toEqual({ success: true, data: mockProfile });
      expect(mockBusinessesService.getProfile).toHaveBeenCalledWith(
        'tenant_123',
      );
    });
  });

  describe('updateProfile', () => {
    it('should reject invalid email format', async () => {
      await expect(
        controller.updateProfile(
          {
            userId: 'usr_123',
            tenantId: 'tenant_123',
            employeeId: 'emp_123',
            role: 'OWNER',
            tenantName: 'Zenith',
          },
          { businessEmail: 'invalid-email' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid phone format', async () => {
      await expect(
        controller.updateProfile(
          {
            userId: 'usr_123',
            tenantId: 'tenant_123',
            employeeId: 'emp_123',
            role: 'OWNER',
            tenantName: 'Zenith',
          },
          { phoneNumber: 'abc' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid website URL format', async () => {
      await expect(
        controller.updateProfile(
          {
            userId: 'usr_123',
            tenantId: 'tenant_123',
            employeeId: 'emp_123',
            role: 'OWNER',
            tenantName: 'Zenith',
          },
          { website: 'ftp://noturl' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid postalCode format', async () => {
      await expect(
        controller.updateProfile(
          {
            userId: 'usr_123',
            tenantId: 'tenant_123',
            employeeId: 'emp_123',
            role: 'OWNER',
            tenantName: 'Zenith',
          },
          { postalCode: '1' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject display name that is too long', async () => {
      await expect(
        controller.updateProfile(
          {
            userId: 'usr_123',
            tenantId: 'tenant_123',
            employeeId: 'emp_123',
            role: 'OWNER',
            tenantName: 'Zenith',
          },
          { displayName: 'a'.repeat(101) },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept valid inputs and call updateProfile service', async () => {
      const body = {
        legalBusinessName: 'Zenith Inc',
        displayName: 'Zenith Properties',
        businessEmail: 'contact@zenith.com',
        phoneNumber: '+919988776655',
        website: 'https://zenith.com',
        postalCode: '560001',
        businessDescription: 'Real estate company description',
      };

      const mockUpdated = { id: 'profile_123', ...body };
      mockBusinessesService.updateProfile.mockResolvedValueOnce(mockUpdated);

      const result = await controller.updateProfile(
        {
          userId: 'usr_123',
          tenantId: 'tenant_123',
          employeeId: 'emp_123',
          role: 'OWNER',
          tenantName: 'Zenith',
        },
        body,
      );

      expect(result).toEqual({ success: true, data: mockUpdated });
      expect(mockBusinessesService.updateProfile).toHaveBeenCalledWith(
        'tenant_123',
        body,
      );
    });
  });

  describe('getSettings', () => {
    it('should call getSettings service and return payload', async () => {
      const mockSettings = {
        id: 'settings_123',
        tenantId: 'tenant_123',
        timezone: 'UTC',
      };
      mockBusinessesService.getSettings.mockResolvedValueOnce(mockSettings);

      const result = await controller.getSettings({
        userId: 'usr_123',
        tenantId: 'tenant_123',
        employeeId: 'emp_123',
        role: 'OWNER',
        tenantName: 'Zenith Properties',
      });

      expect(result).toEqual({ success: true, data: mockSettings });
      expect(mockBusinessesService.getSettings).toHaveBeenCalledWith(
        'tenant_123',
      );
    });
  });

  describe('updateSettings', () => {
    it('should reject invalid currency format', async () => {
      await expect(
        controller.updateSettings(
          {
            userId: 'usr_123',
            tenantId: 'tenant_123',
            employeeId: 'emp_123',
            role: 'OWNER',
            tenantName: 'Zenith',
          },
          { currency: 'US' }, // not 3 chars
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid language format', async () => {
      await expect(
        controller.updateSettings(
          {
            userId: 'usr_123',
            tenantId: 'tenant_123',
            employeeId: 'emp_123',
            role: 'OWNER',
            tenantName: 'Zenith',
          },
          { language: 'e' }, // not 2-5 chars
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid dateFormat', async () => {
      await expect(
        controller.updateSettings(
          {
            userId: 'usr_123',
            tenantId: 'tenant_123',
            employeeId: 'emp_123',
            role: 'OWNER',
            tenantName: 'Zenith',
          },
          { dateFormat: 'INVALID_FORMAT' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid timeFormat', async () => {
      await expect(
        controller.updateSettings(
          {
            userId: 'usr_123',
            tenantId: 'tenant_123',
            employeeId: 'emp_123',
            role: 'OWNER',
            tenantName: 'Zenith',
          },
          { timeFormat: '24' }, // must be 12h or 24h
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid weekStartsOn', async () => {
      await expect(
        controller.updateSettings(
          {
            userId: 'usr_123',
            tenantId: 'tenant_123',
            employeeId: 'emp_123',
            role: 'OWNER',
            tenantName: 'Zenith',
          },
          { weekStartsOn: 7 }, // must be 0 to 6
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid defaultCountry', async () => {
      await expect(
        controller.updateSettings(
          {
            userId: 'usr_123',
            tenantId: 'tenant_123',
            employeeId: 'emp_123',
            role: 'OWNER',
            tenantName: 'Zenith',
          },
          { defaultCountry: 'USA' }, // must be 2 chars
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid businessHours day name', async () => {
      await expect(
        controller.updateSettings(
          {
            userId: 'usr_123',
            tenantId: 'tenant_123',
            employeeId: 'emp_123',
            role: 'OWNER',
            tenantName: 'Zenith',
          },
          {
            businessHours: {
              monday: { closed: true },
              funday: { closed: false },
            },
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept valid inputs and call updateSettings service', async () => {
      const body = {
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        language: 'en-IN',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12h',
        weekStartsOn: 0,
        defaultCountry: 'IN',
        businessHours: {
          monday: { closed: false, open: '09:00', close: '18:00' },
          tuesday: { closed: true, open: '', close: '' },
        },
      };

      const mockUpdated = { id: 'settings_123', ...body };
      mockBusinessesService.updateSettings.mockResolvedValueOnce(mockUpdated);

      const result = await controller.updateSettings(
        {
          userId: 'usr_123',
          tenantId: 'tenant_123',
          employeeId: 'emp_123',
          role: 'OWNER',
          tenantName: 'Zenith',
        },
        body,
      );

      expect(result).toEqual({ success: true, data: mockUpdated });
      expect(mockBusinessesService.updateSettings).toHaveBeenCalledWith(
        'tenant_123',
        body,
      );
    });
  });
});
