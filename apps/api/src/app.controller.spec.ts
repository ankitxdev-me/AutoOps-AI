import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  const mockPrismaService = {};

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return health status object', () => {
      const result = appController.getHealth();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('api');
      expect(result.version).toBe('0.1.0');
      expect(typeof result.timestamp).toBe('string');
    });
  });

  describe('getDashboardSummary', () => {
    it('should return summary metrics', async () => {
      const mockTenantContext = {
        userId: 'usr-1',
        tenantId: 'tnt-1',
        employeeId: 'emp-1',
        role: 'OWNER' as const,
        tenantName: 'Test Business',
      };

      const mockProfile = {
        displayName: 'Apex Real Estate',
        legalBusinessName: 'Apex Real Estate LLC',
        industry: 'Real Estate Development',
        createdAt: new Date(),
      };

      const mockSettings = {
        timezone: 'UTC',
      };

      // Mock prisma calls
      const prisma = mockPrismaService as any;
      prisma.businessProfile = {
        findUnique: jest.fn().mockResolvedValue(mockProfile),
      };
      prisma.businessSettings = {
        findUnique: jest.fn().mockResolvedValue(mockSettings),
      };
      prisma.employee = {
        count: jest.fn().mockResolvedValue(3),
      };
      prisma.invitation = {
        count: jest.fn().mockResolvedValue(2),
      };

      const result = await appController.getDashboardSummary(mockTenantContext);
      expect(result.success).toBe(true);
      expect(result.data.business.name).toBe('Apex Real Estate');
      expect(result.data.business.industry).toBe('Real Estate Development');
      expect(result.data.members.activeCount).toBe(3);
      expect(result.data.members.pendingCount).toBe(2);
    });
  });
});
