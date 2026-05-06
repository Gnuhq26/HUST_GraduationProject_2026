import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface CurrentUserPayload {
  UserID: number;
  Email: string;
  FullName: string | null;
  Phone: string | null;
  Address: string | null;
  CreatedAt: Date;
}

/**
 * Decorator to extract current authenticated user from req.user,
 * which is populated by JwtStrategy.validate() with fresh DB data.
 *
 * @example — get userId only (default)
 * async getProfile(@CurrentUser() userId: number) { ... }
 *
 * @example — get full user object
 * async getProfile(@CurrentUser('full') user: CurrentUserPayload) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: 'full' | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: Record<string, unknown> }>();
    const user = request.user;

    if (!user) return null;

    if (data === 'full') {
      return user as unknown as CurrentUserPayload;
    }

    // Default: return userId
    return user['UserID'] as number;
  },
);
