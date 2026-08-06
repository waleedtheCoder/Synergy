import type { Role } from "@synergi/shared-types";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
}
