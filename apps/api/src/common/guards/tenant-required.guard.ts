import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { TenantContextPayload } from '../decorators/tenant-context.decorator';

interface RequestWithTenantContext extends Request {
  tenantContext?: TenantContextPayload | null;
}

@Injectable()
export class TenantRequiredGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithTenantContext>();
    if (!request.tenantContext) {
      throw new ForbiddenException('Active business context is required');
    }
    return true;
  }
}
