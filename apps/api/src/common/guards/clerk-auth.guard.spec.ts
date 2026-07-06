import { Test, TestingModule } from '@nestjs/testing';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

interface MockRequestWithUser {
  user?: { clerkId: string; email: string };
  headers: Record<string, string>;
}

describe('ClerkAuthGuard', () => {
  let guard: ClerkAuthGuard;
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ClerkAuthGuard],
    }).compile();

    guard = module.get<ClerkAuthGuard>(ClerkAuthGuard);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('Mock Authentication (Non-Production)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should reject mock-valid-token if ENABLE_MOCK_AUTH is not true', async () => {
      process.env.ENABLE_MOCK_AUTH = 'false';
      process.env.CLERK_SECRET_KEY = 'sk_test_real';

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

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should accept mock-valid-token if ENABLE_MOCK_AUTH is true', async () => {
      process.env.ENABLE_MOCK_AUTH = 'true';

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
      expect(mockRequest.user?.email).toBe('ankit@autoops.ai');
    });

    it('should reject invalid mock-invalid-token even if ENABLE_MOCK_AUTH is true', async () => {
      process.env.ENABLE_MOCK_AUTH = 'true';

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
  });

  describe('Production Environment Security', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.CLERK_SECRET_KEY = 'sk_live_production_key';
    });

    it('should reject mock tokens in production even if ENABLE_MOCK_AUTH is true', async () => {
      process.env.ENABLE_MOCK_AUTH = 'true';

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

      // Mock verifyToken to fail
      (verifyToken as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid signature'),
      );

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(verifyToken).toHaveBeenCalledWith('mock-valid-token', {
        secretKey: 'sk_live_production_key',
      });
    });

    it('should throw UnauthorizedException if CLERK_SECRET_KEY is missing', async () => {
      delete process.env.CLERK_SECRET_KEY;

      const mockRequest: MockRequestWithUser = {
        headers: {
          authorization: 'Bearer valid-clerk-token',
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

    it('should accept valid Clerk JWT token and verify signature', async () => {
      const mockRequest: MockRequestWithUser = {
        headers: {
          authorization: 'Bearer valid-clerk-token',
        },
      };
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      (verifyToken as jest.Mock).mockResolvedValueOnce({
        sub: 'user_clerk_123',
        email: 'user@production.com',
      });

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
      expect(mockRequest.user?.clerkId).toBe('user_clerk_123');
      expect(mockRequest.user?.email).toBe('user@production.com');
      expect(verifyToken).toHaveBeenCalledWith('valid-clerk-token', {
        secretKey: 'sk_live_production_key',
      });
    });

    it('should throw UnauthorizedException on verification failures', async () => {
      const mockRequest: MockRequestWithUser = {
        headers: {
          authorization: 'Bearer invalid-clerk-token',
        },
      };
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      (verifyToken as jest.Mock).mockRejectedValueOnce(
        new Error('JWT Expired'),
      );

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('General Request Validation', () => {
    it('should throw UnauthorizedException if authorization header is missing', async () => {
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

    it('should throw UnauthorizedException on invalid header structure', async () => {
      const mockRequest: MockRequestWithUser = {
        headers: {
          authorization: 'Basic credentials',
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
  });
});
