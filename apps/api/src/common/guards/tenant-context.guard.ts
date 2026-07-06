import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    clerkId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  dbUser?: Record<string, unknown>;
  tenantContext?: {
    userId: string;
    tenantId: string;
    employeeId: string;
    role: string;
    tenantName: string;
  } | null;
}

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !user.clerkId) {
      return true;
    }

    // 1. Resolve or Create User record in PostgreSQL
    let dbUser = await this.prisma.user.findUnique({
      where: { clerkId: user.clerkId },
    });

    if (!dbUser) {
      dbUser = await this.prisma.user.create({
        data: {
          clerkId: user.clerkId,
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          avatarUrl: user.avatarUrl || '',
        },
      });
    }

    // 2. Resolve active Employee / Tenant context
    const employee = await this.prisma.employee.findFirst({
      where: { userId: dbUser.id, status: 'active' },
      include: { tenant: true },
    });

    if (employee) {
      request.tenantContext = {
        userId: dbUser.id,
        tenantId: employee.tenantId,
        employeeId: employee.id,
        role: employee.role,
        tenantName: employee.tenant.name,
      };
    } else {
      request.tenantContext = null;
    }

    request.dbUser = dbUser;

    return true;
  }
}
