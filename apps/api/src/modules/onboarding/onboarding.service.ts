import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async getStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { onboardingStep: true, status: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const step = tenant.onboardingStep;
    let completionPercentage = 0;
    let isCompleted = false;

    if (step === '1') {
      completionPercentage = 25;
    } else if (step === '2') {
      completionPercentage = 50;
    } else if (step === '3') {
      completionPercentage = 75;
    } else if (step === 'completed') {
      completionPercentage = 100;
      isCompleted = true;
    }

    return {
      onboardingStep: step,
      completionPercentage,
      isCompleted,
    };
  }

  async updateStep(tenantId: string, step: string) {
    const validSteps = ['1', '2', '3', 'completed'];
    if (!validSteps.includes(step)) {
      throw new BadRequestException(`Invalid onboarding step: ${step}`);
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    // Optional validation of step progression
    if (tenant.onboardingStep === 'completed' && step !== 'completed') {
      throw new BadRequestException(
        'Cannot revert onboarding step once completed',
      );
    }

    const updatedTenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        onboardingStep: step,
        status: step === 'completed' ? 'active' : tenant.status,
      },
    });

    let completionPercentage = 0;
    let isCompleted = false;

    if (updatedTenant.onboardingStep === '1') {
      completionPercentage = 25;
    } else if (updatedTenant.onboardingStep === '2') {
      completionPercentage = 50;
    } else if (updatedTenant.onboardingStep === '3') {
      completionPercentage = 75;
    } else if (updatedTenant.onboardingStep === 'completed') {
      completionPercentage = 100;
      isCompleted = true;
    }

    return {
      onboardingStep: updatedTenant.onboardingStep,
      completionPercentage,
      isCompleted,
    };
  }
}
