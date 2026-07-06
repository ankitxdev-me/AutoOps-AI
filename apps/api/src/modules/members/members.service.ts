import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmployeeRole } from '@prisma/client';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async listMembers(
    tenantId: string,
    cursor?: string,
    limit = 20,
    search?: string,
  ) {
    const take = Math.min(limit, 100);

    const employees = await this.prisma.employee.findMany({
      where: {
        tenantId,
        status: 'active',
        ...(search
          ? {
              user: {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasNextPage = employees.length > take;
    const items = hasNextPage ? employees.slice(0, take) : employees;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasNextPage,
    };
  }

  async inviteMember(
    tenantId: string,
    inviterRole: string,
    data: {
      email: string;
      firstName: string;
      lastName: string;
      role: EmployeeRole;
    },
  ) {
    // 1. Only OWNER and ADMIN can invite
    if (inviterRole !== 'OWNER' && inviterRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Only OWNER or ADMIN members may invite new members',
      );
    }

    // 2. MEMBER cannot be invited as OWNER
    if (data.role === EmployeeRole.OWNER) {
      throw new BadRequestException(
        'Cannot invite a user as OWNER. Ownership cannot be transferred via invitation.',
      );
    }

    // 3. Check if a User with this email is already an active Employee of this tenant
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      const existingEmployee = await this.prisma.employee.findFirst({
        where: { tenantId, userId: existingUser.id, status: 'active' },
      });

      if (existingEmployee) {
        throw new ConflictException(
          'A user with this email is already an active member of this business',
        );
      }
    }

    // 4. Check for a duplicate pending invitation
    const existingInvitation = await this.prisma.invitation.findUnique({
      where: { tenantId_email: { tenantId, email: data.email } },
    });

    if (existingInvitation && existingInvitation.status === 'PENDING') {
      throw new ConflictException(
        'A pending invitation for this email already exists',
      );
    }

    // 5. Upsert the invitation (re-invite if previously cancelled/accepted)
    if (existingInvitation) {
      return this.prisma.invitation.update({
        where: { tenantId_email: { tenantId, email: data.email } },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          status: 'PENDING',
        },
      });
    }

    return this.prisma.invitation.create({
      data: {
        tenantId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        status: 'PENDING',
      },
    });
  }

  async listInvitations(tenantId: string) {
    return this.prisma.invitation.findMany({
      where: { tenantId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }
}
