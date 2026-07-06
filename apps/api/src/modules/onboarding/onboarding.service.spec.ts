import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('OnboardingService', () => {
  let service: OnboardingService;

  const mockFindUniqueTenant = jest.fn();
  const mockUpdateTenant = jest.fn();

  const mockPrisma = {
    tenant: {
      findUnique: mockFindUniqueTenant,
      update: mockUpdateTenant,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStatus', () => {
    it('should calculate status for step 1', async () => {
      mockFindUniqueTenant.mockResolvedValueOnce({
        id: 't1',
        onboardingStep: '1',
        status: 'onboarding_pending',
      });

      const res = await service.getStatus('t1');
      expect(res).toEqual({
        onboardingStep: '1',
        completionPercentage: 25,
        isCompleted: false,
      });
    });

    it('should throw if tenant not found', async () => {
      mockFindUniqueTenant.mockResolvedValueOnce(null);
      await expect(service.getStatus('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateStep', () => {
    it('should prevent invalid step values', async () => {
      await expect(service.updateStep('t1', 'invalid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if tenant not found on update', async () => {
      mockFindUniqueTenant.mockResolvedValueOnce(null);
      await expect(service.updateStep('t1', '2')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update step successfully', async () => {
      mockFindUniqueTenant.mockResolvedValueOnce({
        id: 't1',
        onboardingStep: '1',
        status: 'onboarding_pending',
      });
      mockUpdateTenant.mockResolvedValueOnce({
        id: 't1',
        onboardingStep: '2',
        status: 'onboarding_pending',
      });

      const res = await service.updateStep('t1', '2');
      expect(res.onboardingStep).toBe('2');
      expect(res.completionPercentage).toBe(50);
      expect(mockUpdateTenant).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { onboardingStep: '2', status: 'onboarding_pending' },
      });
    });

    it('should update status to active when completed', async () => {
      mockFindUniqueTenant.mockResolvedValueOnce({
        id: 't1',
        onboardingStep: '3',
        status: 'onboarding_pending',
      });
      mockUpdateTenant.mockResolvedValueOnce({
        id: 't1',
        onboardingStep: 'completed',
        status: 'active',
      });

      const res = await service.updateStep('t1', 'completed');
      expect(res.isCompleted).toBe(true);
      expect(res.completionPercentage).toBe(100);
      expect(mockUpdateTenant).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { onboardingStep: 'completed', status: 'active' },
      });
    });
  });
});
