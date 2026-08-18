export type QuotationStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "COUNTERED" | "EXPIRED";

export interface QuotationItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
}

export interface Quotation {
  id: string;
  chatId: string;
  projectRequestId: string | null;
  status: QuotationStatus;
  totalAmount: string;
  currency: string;
  notes: string | null;
  validUntil: string | null;
  createdAt: string;
  items: QuotationItem[];
  professional: { id: string; userId: string; slug: string; businessName: string | null };
  client: { id: string; userId: string; user: { firstName: string; lastName: string } };
}
