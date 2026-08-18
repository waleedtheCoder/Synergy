import type { FeedProfessional } from "./types";

export function professionalName(professional: FeedProfessional): string {
  return professional.businessName ?? `${professional.user.firstName} ${professional.user.lastName}`;
}
