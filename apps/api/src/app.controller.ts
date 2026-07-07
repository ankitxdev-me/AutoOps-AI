import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from './common/guards/clerk-auth.guard';
import { TenantContextGuard } from './common/guards/tenant-context.guard';
import { TenantRequiredGuard } from './common/guards/tenant-required.guard';
import {
  TenantContext,
  TenantContextPayload,
} from './common/decorators/tenant-context.decorator';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('dashboard/summary')
  @UseGuards(ClerkAuthGuard, TenantContextGuard, TenantRequiredGuard)
  async getDashboardSummary(
    @TenantContext() tenantContext: TenantContextPayload,
  ) {
    const tenantId = tenantContext.tenantId;

    const profile = await this.prisma.businessProfile.findUnique({
      where: { tenantId },
    });

    const settings = await this.prisma.businessSettings.findUnique({
      where: { tenantId },
    });

    const activeCount = await this.prisma.employee.count({
      where: { tenantId, status: 'active' },
    });

    const pendingCount = await this.prisma.invitation.count({
      where: { tenantId, status: 'PENDING' },
    });

    return {
      success: true,
      data: {
        business: {
          id: tenantId,
          name:
            profile?.displayName ||
            profile?.legalBusinessName ||
            tenantContext.tenantName,
          industry: profile?.industry || 'Not Specified',
          createdAt: profile?.createdAt || new Date(),
          profile: profile || null,
          settings: settings || null,
        },
        members: {
          activeCount,
          pendingCount,
        },
        workflows: 0,
        agents: 0,
      },
    };
  }
}
