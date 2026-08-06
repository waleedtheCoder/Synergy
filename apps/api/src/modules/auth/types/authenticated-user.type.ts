import type { Role } from '../../../../generated/prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
}
