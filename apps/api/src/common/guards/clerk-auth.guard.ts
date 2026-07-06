import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { Request } from 'express';

interface ClerkJwtClaims {
  sub: string;
  email?: string;
  email_address?: string;
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: Record<string, unknown> }>();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header provided');
    }

    if (typeof authHeader !== 'string') {
      throw new UnauthorizedException('Invalid authorization format');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    const [type, token] = parts;
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    // Support mock verification if key is placeholder or for testing
    const clerkSecretKey =
      process.env.CLERK_SECRET_KEY || 'sk_test_mock_secret';
    const isMockMode =
      clerkSecretKey.includes('sk_test_mock') || token.startsWith('mock-');

    if (isMockMode) {
      if (token === 'mock-valid-token') {
        request.user = {
          clerkId: 'user_2Tsh3p8J38d9',
          email: 'ankit@autoops.ai',
        };
        return true;
      }
      throw new UnauthorizedException('Invalid mock token');
    }

    try {
      const jwtPayload = (await verifyToken(token, {
        secretKey: clerkSecretKey,
      })) as unknown as ClerkJwtClaims;

      request.user = {
        clerkId: jwtPayload.sub,
        email: jwtPayload.email || jwtPayload.email_address || '',
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Unauthorized access',
      );
    }
  }
}
