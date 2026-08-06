import type { Role } from '../../../../generated/prisma';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface JwtRefreshPayload {
  sub: string;
  jti: string;
}
