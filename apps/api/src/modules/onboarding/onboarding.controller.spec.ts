import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { TenantRequiredGuard } from '../../common/guards/tenant-required.guard';
import { BadRequestException } from '@nestjs/common';

const mockTenantContext = {
  userId: 'usr_123',
  tenantId: 'tenant_123',
  employeeId: 'emp_123',
  role: 'OWNER' as const,
  tenantName: 'Zenith Properties',
};

describe('OnboardingController', () => {
  let controller: OnboardingController;

  const mockOnboardingService = {
    getStatus: jest.fn(),
    updateStep: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnboardingController],
      providers: [
        { provide: OnboardingService, useValue: mockOnboardingService },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantContextGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantRequiredGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OnboardingController>(OnboardingController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get status successfully', async () => {
    const mockStatus = {
      onboardingStep: '1',
      completionPercentage: 25,
      isCompleted: false,
    };
    mockOnboardingService.getStatus.mockResolvedValueOnce(mockStatus);

    const res = await controller.getStatus(mockTenantContext);
    expect(res.success).toBe(true);
    expect(res.data).toEqual(mockStatus);
    expect(mockOnboardingService.getStatus).toHaveBeenCalledWith('tenant_123');
  });

  it('should update step successfully', async () => {
    const mockStatus = {
      onboardingStep: '2',
      completionPercentage: 50,
      isCompleted: false,
    };
    mockOnboardingService.updateStep.mockResolvedValueOnce(mockStatus);

    const res = await controller.updateStep(mockTenantContext, { step: '2' });
    expect(res.success).toBe(true);
    expect(res.data).toEqual(mockStatus);
    expect(mockOnboardingService.updateStep).toHaveBeenCalledWith(
      'tenant_123',
      '2',
    );
  });

  it('should throw BadRequestException if step is missing or invalid type', async () => {
    await expect(
      controller.updateStep(mockTenantContext, {
        step: undefined as unknown as string,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
