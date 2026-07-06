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

      // Automatically create a default BusinessProfile together with the Tenant
      await tx.businessProfile.create({
        data: {
          tenantId: tenant.id,
          legalBusinessName: data.name,
          displayName: data.name,
          industry: data.industry,
          country: data.country,
        },
      });

      // Automatically create a default BusinessSettings together with the Tenant
      await tx.businessSettings.create({
        data: {
          tenantId: tenant.id,
          defaultCountry: data.country,
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

  async getProfile(tenantId: string) {
    const profile = await this.prisma.businessProfile.findUnique({
      where: { tenantId },
    });
    if (!profile) {
      throw new BadRequestException('Business profile not found');
    }
    return profile;
  }

  async updateProfile(
    tenantId: string,
    data: Partial<import('@prisma/client').BusinessProfile>,
  ) {
    const profile = await this.prisma.businessProfile.findUnique({
      where: { tenantId },
    });
    if (!profile) {
      throw new BadRequestException('Business profile not found');
    }

    return this.prisma.businessProfile.update({
      where: { tenantId },
      data: {
        legalBusinessName: data.legalBusinessName,
        displayName: data.displayName,
        businessEmail: data.businessEmail,
        phoneNumber: data.phoneNumber,
        website: data.website,
        industry: data.industry,
        businessDescription: data.businessDescription,
        country: data.country,
        state: data.state,
        city: data.city,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        postalCode: data.postalCode,
        logoUrl: data.logoUrl,
      },
    });
  }

  async getSettings(tenantId: string) {
    const settings = await this.prisma.businessSettings.findUnique({
      where: { tenantId },
    });
    if (!settings) {
      throw new BadRequestException('Business settings not found');
    }
    return settings;
  }

  async updateSettings(
    tenantId: string,
    data: Partial<
      Omit<import('@prisma/client').BusinessSettings, 'businessHours'>
    > & { businessHours?: any },
  ) {
    const settings = await this.prisma.businessSettings.findUnique({
      where: { tenantId },
    });
    if (!settings) {
      throw new BadRequestException('Business settings not found');
    }

    return this.prisma.businessSettings.update({
      where: { tenantId },
      data: {
        timezone: data.timezone,
        currency: data.currency,
        language: data.language,
        dateFormat: data.dateFormat,
        timeFormat: data.timeFormat,
        businessHours: (data.businessHours ??
          undefined) as import('@prisma/client').Prisma.InputJsonValue,
        weekStartsOn: data.weekStartsOn,
        defaultCountry: data.defaultCountry,
      },
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
