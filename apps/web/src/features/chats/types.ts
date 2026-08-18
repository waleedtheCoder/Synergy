export type MessageType = "TEXT" | "IMAGE" | "PDF" | "QUOTATION_REQUEST" | "QUOTATION" | "MEETING" | "SYSTEM";

export interface ChatParticipantUser {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface ChatClientParticipant {
  id: string;
  userId: string;
  user: ChatParticipantUser;
}

export interface ChatProfessionalParticipant {
  id: string;
  userId: string;
  slug: string;
  businessName: string | null;
  user: ChatParticipantUser;
}

export interface MessageQuotationItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
}

export type QuotationStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "COUNTERED" | "EXPIRED";

export interface MessageQuotation {
  id: string;
  status: QuotationStatus;
  totalAmount: string;
  currency: string;
  notes: string | null;
  validUntil: string | null;
  items: MessageQuotationItem[];
}

export type MeetingStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export interface MessageMeeting {
  id: string;
  scheduledAt: string;
  durationMins: number;
  status: MeetingStatus;
  location: string | null;
  meetingLink: string | null;
  notes: string | null;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  content: string | null;
  readAt: string | null;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  quotation: MessageQuotation | null;
  meeting: MessageMeeting | null;
}

export interface Chat {
  id: string;
  projectRequestId: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  client: ChatClientParticipant;
  professional: ChatProfessionalParticipant;
}

export interface ChatSummary extends Chat {
  lastMessage: ChatMessage | null;
  unreadCount: number;
}
