import type { ChatClientParticipant, ChatProfessionalParticipant } from "./types";

export function participantName(
  participant: ChatClientParticipant | ChatProfessionalParticipant,
): string {
  if ("businessName" in participant && participant.businessName) {
    return participant.businessName;
  }
  return `${participant.user.firstName} ${participant.user.lastName}`;
}
