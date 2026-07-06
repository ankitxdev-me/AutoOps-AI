import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { TenantRequiredGuard } from '../../common/guards/tenant-required.guard';
import { BusinessesService } from './businesses.service';
import { User } from '../../common/decorators/user.decorator';
import {
  TenantContext,
  TenantContextPayload,
} from '../../common/decorators/tenant-context.decorator';

class CreateBusinessDto {
  name: string;
  industry: string;
  country: string;
}

export class UpdateBusinessProfileDto {
  legalBusinessName?: string;
  displayName?: string;
  businessEmail?: string;
  phoneNumber?: string;
  website?: string;
  industry?: string;
  businessDescription?: string;
  country?: string;
  state?: string;
  city?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  logoUrl?: string;

  static validate(dto: UpdateBusinessProfileDto) {
    if (dto.legalBusinessName !== undefined) {
      if (
        typeof dto.legalBusinessName !== 'string' ||
        dto.legalBusinessName.trim().length === 0 ||
        dto.legalBusinessName.length > 100
      ) {
        throw new BadRequestException(
          'Legal business name must be between 1 and 100 characters',
        );
      }
    }
    if (dto.displayName !== undefined) {
      if (
        typeof dto.displayName !== 'string' ||
        dto.displayName.trim().length === 0 ||
        dto.displayName.length > 100
      ) {
        throw new BadRequestException(
          'Display name must be between 1 and 100 characters',
        );
      }
    }
    if (
      dto.businessEmail !== undefined &&
      dto.businessEmail !== null &&
      dto.businessEmail !== ''
    ) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (
        typeof dto.businessEmail !== 'string' ||
        !emailRegex.test(dto.businessEmail)
      ) {
        throw new BadRequestException('Invalid business email format');
      }
    }
    if (
      dto.phoneNumber !== undefined &&
      dto.phoneNumber !== null &&
      dto.phoneNumber !== ''
    ) {
      const phoneRegex = /^\+?[0-9\s-()]{7,20}$/;
      if (
        typeof dto.phoneNumber !== 'string' ||
        !phoneRegex.test(dto.phoneNumber)
      ) {
        throw new BadRequestException('Invalid phone number format');
      }
    }
    if (
      dto.website !== undefined &&
      dto.website !== null &&
      dto.website !== ''
    ) {
      const urlRegex =
        /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]+)*\/?$/;
      if (typeof dto.website !== 'string' || !urlRegex.test(dto.website)) {
        throw new BadRequestException('Invalid website URL format');
      }
    }
    if (
      dto.postalCode !== undefined &&
      dto.postalCode !== null &&
      dto.postalCode !== ''
    ) {
      const postalRegex = /^[a-zA-Z0-9\s-]{3,10}$/;
      if (
        typeof dto.postalCode !== 'string' ||
        !postalRegex.test(dto.postalCode)
      ) {
        throw new BadRequestException('Invalid postal code format');
      }
    }
    if (
      dto.businessDescription !== undefined &&
      dto.businessDescription !== null
    ) {
      if (
        typeof dto.businessDescription !== 'string' ||
        dto.businessDescription.length > 1000
      ) {
        throw new BadRequestException(
          'Description must not exceed 1000 characters',
        );
      }
    }
    if (
      dto.logoUrl !== undefined &&
      dto.logoUrl !== null &&
      dto.logoUrl !== ''
    ) {
      const urlRegex =
        /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]+)*\/?$/;
      if (typeof dto.logoUrl !== 'string' || !urlRegex.test(dto.logoUrl)) {
        throw new BadRequestException('Invalid logo URL format');
      }
    }
  }
}

export class UpdateBusinessSettingsDto {
  timezone?: string;
  currency?: string;
  language?: string;
  dateFormat?: string;
  timeFormat?: string;
  businessHours?: Record<string, unknown> | null;
  weekStartsOn?: number;
  defaultCountry?: string;

  static validate(dto: UpdateBusinessSettingsDto) {
    if (dto.timezone !== undefined) {
      if (
        typeof dto.timezone !== 'string' ||
        dto.timezone.trim().length === 0
      ) {
        throw new BadRequestException('Timezone must be a non-empty string');
      }
    }

    if (dto.currency !== undefined) {
      if (
        typeof dto.currency !== 'string' ||
        dto.currency.trim().length !== 3
      ) {
        throw new BadRequestException(
          'Currency must be a 3-character ISO code',
        );
      }
    }

    if (dto.language !== undefined) {
      if (
        typeof dto.language !== 'string' ||
        dto.language.trim().length < 2 ||
        dto.language.trim().length > 5
      ) {
        throw new BadRequestException(
          'Language must be a 2 to 5 character code',
        );
      }
    }

    if (dto.dateFormat !== undefined) {
      const allowedFormats = [
        'YYYY-MM-DD',
        'DD/MM/YYYY',
        'MM/DD/YYYY',
        'DD-MM-YYYY',
        'YYYY/MM/DD',
      ];
      if (
        typeof dto.dateFormat !== 'string' ||
        !allowedFormats.includes(dto.dateFormat)
      ) {
        throw new BadRequestException(
          'Date format must be one of: ' + allowedFormats.join(', '),
        );
      }
    }

    if (dto.timeFormat !== undefined) {
      if (dto.timeFormat !== '12h' && dto.timeFormat !== '24h') {
        throw new BadRequestException('Time format must be "12h" or "24h"');
      }
    }

    if (dto.weekStartsOn !== undefined) {
      if (
        typeof dto.weekStartsOn !== 'number' ||
        dto.weekStartsOn < 0 ||
        dto.weekStartsOn > 6
      ) {
        throw new BadRequestException(
          'Week starts on must be an integer between 0 (Sunday) and 6 (Saturday)',
        );
      }
    }

    if (dto.defaultCountry !== undefined) {
      if (
        typeof dto.defaultCountry !== 'string' ||
        dto.defaultCountry.trim().length !== 2
      ) {
        throw new BadRequestException(
          'Default country must be a 2-character country code',
        );
      }
    }

    if (dto.businessHours !== undefined && dto.businessHours !== null) {
      if (typeof dto.businessHours !== 'object') {
        throw new BadRequestException(
          'Business hours must be a valid JSON object',
        );
      }
      const days = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];
      for (const key of Object.keys(dto.businessHours)) {
        if (!days.includes(key.toLowerCase())) {
          throw new BadRequestException(
            `Invalid day name in business hours: ${key}`,
          );
        }
        const val = dto.businessHours[key];
        if (typeof val !== 'object' || val === null) {
          throw new BadRequestException(
            `Business hours for day "${key}" must be an object`,
          );
        }
        const valObj = val as Record<string, unknown>;
        if ('closed' in valObj && typeof valObj.closed !== 'boolean') {
          throw new BadRequestException(
            `"closed" property for day "${key}" must be a boolean`,
          );
        }
        if ('open' in valObj && typeof valObj.open !== 'string') {
          throw new BadRequestException(
            `"open" property for day "${key}" must be a string`,
          );
        }
        if ('close' in valObj && typeof valObj.close !== 'string') {
          throw new BadRequestException(
            `"close" property for day "${key}" must be a string`,
          );
        }
      }
    }
  }
}

@Controller('businesses')
@UseGuards(ClerkAuthGuard, TenantContextGuard)
export class BusinessesController {
  constructor(private businessesService: BusinessesService) {}

  @Post()
  async create(
    @User() user: Record<string, unknown> | undefined,
    @Body() body: CreateBusinessDto,
  ) {
    if (!user || typeof user.clerkId !== 'string') {
      throw new BadRequestException('Authentication context missing clerkId');
    }

    if (!body.name || typeof body.name !== 'string') {
      throw new BadRequestException('Business name is required');
    }

    if (!body.industry || typeof body.industry !== 'string') {
      throw new BadRequestException('Industry is required');
    }

    if (!body.country || typeof body.country !== 'string') {
      throw new BadRequestException('Country is required');
    }

    return this.businessesService.createBusiness(user.clerkId, body);
  }

  @Get('active/profile')
  @UseGuards(TenantRequiredGuard)
  async getProfile(@TenantContext() tenantContext: TenantContextPayload) {
    const profile = await this.businessesService.getProfile(
      tenantContext.tenantId,
    );
    return {
      success: true,
      data: profile,
    };
  }

  @Patch('active/profile')
  @UseGuards(TenantRequiredGuard)
  async updateProfile(
    @TenantContext() tenantContext: TenantContextPayload,
    @Body() body: UpdateBusinessProfileDto,
  ) {
    UpdateBusinessProfileDto.validate(body);
    const updatedProfile = await this.businessesService.updateProfile(
      tenantContext.tenantId,
      body,
    );
    return {
      success: true,
      data: updatedProfile,
    };
  }

  @Get('active/settings')
  @UseGuards(TenantRequiredGuard)
  async getSettings(@TenantContext() tenantContext: TenantContextPayload) {
    const settings = await this.businessesService.getSettings(
      tenantContext.tenantId,
    );
    return {
      success: true,
      data: settings,
    };
  }

  @Patch('active/settings')
  @UseGuards(TenantRequiredGuard)
  async updateSettings(
    @TenantContext() tenantContext: TenantContextPayload,
    @Body() body: UpdateBusinessSettingsDto,
  ) {
    UpdateBusinessSettingsDto.validate(body);
    const updatedSettings = await this.businessesService.updateSettings(
      tenantContext.tenantId,
      body,
    );
    return {
      success: true,
      data: updatedSettings,
    };
  }
}
