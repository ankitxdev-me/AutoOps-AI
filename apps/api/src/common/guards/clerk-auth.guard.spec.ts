import { Test, TestingModule } from '@nestjs/testing';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

interface MockRequestWithUser {
  user?: { clerkId: string };
  headers: Record<string, string>;
}

describe('ClerkAuthGuard', () => {
  let guard: ClerkAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClerkAuthGuard],
    }).compile();

    guard = module.get<ClerkAuthGuard>(ClerkAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow activation with mock-valid-token', async () => {
    const mockRequest: MockRequestWithUser = {
      headers: {
        authorization: 'Bearer mock-valid-token',
      },
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
    expect(mockRequest.user?.clerkId).toBe('user_2Tsh3p8J38d9');
  });

  it('should fail activation with invalid mock token', async () => {
    const mockRequest: MockRequestWithUser = {
      headers: {
        authorization: 'Bearer mock-invalid-token',
      },
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should fail activation with missing authorization header', async () => {
    const mockRequest: MockRequestWithUser = {
      headers: {},
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
