import { Controller, Get, UseGuards, Req } from '@nestjs/common';
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

@Controller('auth')
@UseGuards(ClerkAuthGuard, TenantContextGuard)
export class AuthController {
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    const user = req.dbUser;
    if (!user) {
      return {
        success: false,
        data: null,
      };
    }

    const tenantContext = req.tenantContext;

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          clerkId: user.clerkId,
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          avatarUrl: user.avatarUrl || '',
        },
        activeEmployee: tenantContext
          ? {
              id: tenantContext.employeeId,
              tenantId: tenantContext.tenantId,
              tenantName: tenantContext.tenantName,
              role: tenantContext.role,
            }
          : null,
      },
    };
  }
}
