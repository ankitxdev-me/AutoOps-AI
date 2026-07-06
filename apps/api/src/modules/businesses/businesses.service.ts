import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmployeeRole } from '@prisma/client';

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  async createBusiness(
    clerkId: string,
    data: { name: string; industry: string; country: string },
  ) {
    // 1. Resolve PostgreSQL DB User ID via Clerk User ID
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new BadRequestException('User profile has not been synchronized');
    }

    // 2. A user may create only one business during Sprint 2.
    const existingOwnership = await this.prisma.employee.findFirst({
      where: { userId: user.id, role: EmployeeRole.OWNER },
    });

    if (existingOwnership) {
      throw new ConflictException(
        'A user may only create one business during Sprint 2',
      );
    }

    // 3. Generate slug from name
    const slug = this.generateSlug(data.name);

    // 4. Ensure slug is unique
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      throw new ConflictException(
        `A business with the name "${data.name}" already exists`,
      );
    }

    // 5. Create Tenant and Employee record in a transaction
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug,
          industry: data.industry,
          country: data.country,
          status: 'onboarding_pending',
          onboardingStep: '1',
        },
      });

      const employee = await tx.employee.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: EmployeeRole.OWNER,
          status: 'active',
          title: 'Owner',
        },
      });

      return {
        success: true,
        data: {
          tenant,
          employee,
        },
      };
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
