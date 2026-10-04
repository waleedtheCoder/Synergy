export interface AiStatus {
  enabled: boolean;
}

export interface AiSource {
  n: number;
  label: string;
  snippet: string;
}

export interface AiAnswer {
  answer: string;
  sources: AiSource[];
}

export interface HelpAnswer {
  answer: string;
  sources: { n: number; id: string; title: string }[];
}

export type MatchFit = "strong" | "good" | "partial" | "weak";

export interface ProfessionalMatch {
  professional: {
    id: string;
    slug: string;
    businessName: string | null;
    tagline: string | null;
    ratingAvg: string;
    ratingCount: number;
    verified: boolean;
    availability: "AVAILABLE" | "BUSY" | "UNAVAILABLE";
    user: { firstName: string; lastName: string; avatarUrl: string | null };
    category: { name: string } | null;
    city: { name: string } | null;
  };
  fit: MatchFit | null;
  summary: string | null;
  highlights: string[];
  considerations: string[];
  evidence: { type: string; label: string; snippet: string }[];
}

export interface MatchResult {
  aiExplained: boolean;
  matches: ProfessionalMatch[];
}

export interface ChatAnswer {
  answer: string;
  partial: boolean;
  messageCount: number;
}

export interface QuotationDraft {
  items: { description: string; quantity: number; unitPrice: number }[];
  notes: string;
  rationale: string;
  basedOn: { n: number; id: string; status: string; totalAmount: number; createdAt: string }[];
}

export type Confidence = "low" | "medium" | "high";

export interface ModerationPrecedent {
  n: number;
  id: string;
  status: string;
  snippet: string;
}

export interface ReportAssessment {
  suggestedStatus: "ACTIONED" | "DISMISSED";
  confidence: Confidence;
  flags: string[];
  reasoning: string;
  targetSummary: string | null;
  precedents: ModerationPrecedent[];
}

export interface DisputeAssessment {
  suggestedStatus: "RESOLVED" | "REJECTED" | "UNDER_REVIEW";
  confidence: Confidence;
  suggestedResolution: string;
  reasoning: string;
  precedents: ModerationPrecedent[];
}
