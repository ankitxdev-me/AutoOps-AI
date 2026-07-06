import { Test, TestingModule } from '@nestjs/testing';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { BadRequestException } from '@nestjs/common';

describe('BusinessesController', () => {
  let controller: BusinessesController;

  const mockBusinessesService = {
    createBusiness: jest.fn(),
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
      .compile();

    controller = module.get<BusinessesController>(BusinessesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

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
