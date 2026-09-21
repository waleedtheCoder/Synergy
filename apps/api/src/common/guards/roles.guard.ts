import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../../generated/prisma';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../../modules/auth/types/authenticated-user.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    // Admin accounts carry the most blast radius in this app (bans, refunds,
    // verification approval), so admin-gated resources additionally require
    // 2FA to be enabled — routes without @Roles() (like the 2FA setup/login
    // endpoints themselves) never reach this guard, so there's no lockout:
    // an admin can always log in and enroll in 2FA before touching anything
    // admin-scoped.
    if (user.role === Role.ADMIN && !user.twoFactorEnabled) {
      throw new ForbiddenException(
        'Two-factor authentication must be enabled on this account before accessing admin resources',
      );
    }

    return true;
  }
}
