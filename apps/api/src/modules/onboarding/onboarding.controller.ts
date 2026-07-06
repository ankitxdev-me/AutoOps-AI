import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { TenantRequiredGuard } from '../../common/guards/tenant-required.guard';
import { OnboardingService } from './onboarding.service';
import {
  TenantContext,
  TenantContextPayload,
} from '../../common/decorators/tenant-context.decorator';

class UpdateStepDto {
  step!: string;
}

@Controller('onboarding')
@UseGuards(ClerkAuthGuard, TenantContextGuard, TenantRequiredGuard)
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Get('status')
  async getStatus(@TenantContext() tenantContext: TenantContextPayload) {
    return {
      success: true,
      data: await this.onboardingService.getStatus(tenantContext.tenantId),
    };
  }

  @Patch('step')
  async updateStep(
    @TenantContext() tenantContext: TenantContextPayload,
    @Body() body: UpdateStepDto,
  ) {
    if (!body || typeof body.step !== 'string') {
      throw new BadRequestException('step must be a string');
    }

    return {
      success: true,
      data: await this.onboardingService.updateStep(
        tenantContext.tenantId,
        body.step,
      ),
    };
  }
}
