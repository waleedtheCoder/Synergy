export type ProjectRequestStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface ProjectRequest {
  id: string;
  title: string;
  description: string;
  budgetMin: string | null;
  budgetMax: string | null;
  timeline: string | null;
  address: string | null;
  status: ProjectRequestStatus;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; slug: string } | null;
  city: { id: string; name: string } | null;
  awardedProfessional: { id: string; slug: string; businessName: string | null } | null;
}
