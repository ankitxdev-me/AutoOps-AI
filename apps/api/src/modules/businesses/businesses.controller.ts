import {
  Controller,
  Post,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { BusinessesService } from './businesses.service';
import { User } from '../../common/decorators/user.decorator';

class CreateBusinessDto {
  name: string;
  industry: string;
  country: string;
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
}
