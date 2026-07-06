import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  dbUser?: {
    id: string;
    clerkId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  tenantContext?: {
    userId: string;
    tenantId: string;
    employeeId: string;
    role: string;
    tenantName: string;
  } | null;
}

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
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

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return user info when authenticated', () => {
    const mockRequest = {
      dbUser: {
        id: 'usr_2Tsh3p8J38d9',
        clerkId: 'user_2Tsh3p8J38d9',
        email: 'ankit@autoops.ai',
        firstName: 'Ankit',
        lastName: 'Sharma',
        avatarUrl: 'https://img.clerk.com/placeholder',
      },
      tenantContext: null,
    } as unknown as AuthenticatedRequest;

    const result = controller.getMe(mockRequest);
    expect(result.success).toBe(true);
    expect(result.data.user.clerkId).toBe('user_2Tsh3p8J38d9');
    expect(result.data.user.email).toBe('ankit@autoops.ai');
    expect(result.data.activeEmployee).toBeNull();
  });
});
