import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface TenantContextPayload {
  userId: string;
  tenantId: string;
  employeeId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  tenantName: string;
}

interface RequestWithTenantContext extends Request {
  tenantContext?: TenantContextPayload | null;
}

export const TenantContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantContextPayload | null => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenantContext>();
    return request.tenantContext || null;
  },
);
