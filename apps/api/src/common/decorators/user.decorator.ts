import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const User = createParamDecorator(
  (
    data: unknown,
    ctx: ExecutionContext,
  ): Record<string, unknown> | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: Record<string, unknown> }>();
    return request.user;
  },
);
