import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context
            .switchToHttp()
            .getRequest<Request & { user?: Record<string, unknown> }>();
          const authHeader = request.headers['authorization'];
          if (authHeader === 'Bearer mock-valid-token') {
            request.user = {
              clerkId: 'user_2Tsh3p8J38d9',
              email: 'ankit@autoops.ai',
            };
            return true;
          }
          throw new UnauthorizedException('Invalid token');
        },
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return user info when authenticated', () => {
    const mockUser = {
      clerkId: 'user_2Tsh3p8J38d9',
      email: 'ankit@autoops.ai',
    };
    const result = controller.getMe(mockUser);
    expect(result.success).toBe(true);
    expect(result.data.user.clerkId).toBe('user_2Tsh3p8J38d9');
    expect(result.data.user.email).toBe('ankit@autoops.ai');
    expect(result.data.activeEmployee).toBeNull();
  });
});
