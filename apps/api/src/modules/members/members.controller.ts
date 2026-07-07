import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { TenantRequiredGuard } from '../../common/guards/tenant-required.guard';
import { MembersService } from './members.service';
import {
  TenantContext,
  TenantContextPayload,
} from '../../common/decorators/tenant-context.decorator';
import { EmployeeRole } from '@prisma/client';

class InviteMemberDto {
  email: string;
  firstName: string;
  lastName: string;
  role: EmployeeRole;

  static validate(dto: InviteMemberDto) {
    if (
      !dto.email ||
      typeof dto.email !== 'string' ||
      dto.email.trim() === ''
    ) {
      throw new BadRequestException('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.email.trim())) {
      throw new BadRequestException('Invalid email format');
    }

    if (
      !dto.firstName ||
      typeof dto.firstName !== 'string' ||
      dto.firstName.trim().length === 0
    ) {
      throw new BadRequestException('First name is required');
    }

    if (dto.firstName.trim().length > 50) {
      throw new BadRequestException('First name must not exceed 50 characters');
    }

    if (
      !dto.lastName ||
      typeof dto.lastName !== 'string' ||
      dto.lastName.trim().length === 0
    ) {
      throw new BadRequestException('Last name is required');
    }

    if (dto.lastName.trim().length > 50) {
      throw new BadRequestException('Last name must not exceed 50 characters');
    }

    const validRoles: readonly EmployeeRole[] = [
      EmployeeRole.ADMIN,
      EmployeeRole.MEMBER,
    ];
    if (!dto.role || !validRoles.includes(dto.role)) {
      throw new BadRequestException(
        'Role must be either ADMIN or MEMBER. OWNER cannot be invited.',
      );
    }
  }
}

class UpdateMemberRoleDto {
  role: EmployeeRole;

  static validate(dto: UpdateMemberRoleDto) {
    const validRoles: EmployeeRole[] = [
      EmployeeRole.ADMIN,
      EmployeeRole.MEMBER,
    ];
    if (!dto.role || !validRoles.includes(dto.role)) {
      throw new BadRequestException('Role must be either ADMIN or MEMBER.');
    }
  }
}

@Controller('businesses/active/members')
@UseGuards(ClerkAuthGuard, TenantContextGuard, TenantRequiredGuard)
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  async listMembers(
    @TenantContext() tenantContext: TenantContextPayload,
    @Query('cursor') cursor?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
    @Query('_invitations') invitationsQuery?: string,
  ) {
    const limit = limitStr ? Math.max(1, parseInt(limitStr, 10)) : 20;

    if (invitationsQuery === '1' || invitationsQuery === 'true') {
      const invitations = await this.membersService.listInvitations(
        tenantContext.tenantId,
      );
      return {
        success: true,
        data: invitations,
      };
    }

    const result = await this.membersService.listMembers(
      tenantContext.tenantId,
      cursor,
      limit,
      search,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('invite')
  async inviteMember(
    @TenantContext() tenantContext: TenantContextPayload,
    @Body() body: InviteMemberDto,
  ) {
    InviteMemberDto.validate(body);

    const invitation = await this.membersService.inviteMember(
      tenantContext.tenantId,
      tenantContext.role,
      {
        email: body.email.trim().toLowerCase(),
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        role: body.role,
      },
    );

    return {
      success: true,
      data: invitation,
    };
  }

  @Patch(':id/role')
  async updateMemberRole(
    @TenantContext() tenantContext: TenantContextPayload,
    @Param('id') employeeId: string,
    @Body() body: UpdateMemberRoleDto,
  ) {
    UpdateMemberRoleDto.validate(body);

    const updated = await this.membersService.updateMemberRole(
      tenantContext.tenantId,
      tenantContext.role,
      tenantContext.userId,
      employeeId,
      body.role,
    );

    return {
      success: true,
      message: 'Member role updated successfully.',
      data: updated,
    };
  }

  @Delete(':id')
  async removeMember(
    @TenantContext() tenantContext: TenantContextPayload,
    @Param('id') employeeId: string,
  ) {
    await this.membersService.removeMember(
      tenantContext.tenantId,
      tenantContext.role,
      tenantContext.userId,
      employeeId,
    );

    return {
      success: true,
      message: 'Member removed successfully.',
    };
  }

  @Delete('invitations/:id')
  async cancelInvitation(
    @TenantContext() tenantContext: TenantContextPayload,
    @Param('id') invitationId: string,
  ) {
    await this.membersService.cancelInvitation(
      tenantContext.tenantId,
      tenantContext.role,
      invitationId,
    );

    return {
      success: true,
      message: 'Invitation cancelled successfully.',
    };
  }

  @Post('invitations/:id/resend')
  async resendInvitation(
    @TenantContext() tenantContext: TenantContextPayload,
    @Param('id') invitationId: string,
  ) {
    await this.membersService.resendInvitation(
      tenantContext.tenantId,
      tenantContext.role,
      invitationId,
    );

    return {
      success: true,
      message: 'Invitation resent successfully.',
    };
  }
}
