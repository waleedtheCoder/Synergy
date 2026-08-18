export interface Certificate {
  id: string;
  title: string;
  issuer: string | null;
  issueDate: string | null;
  fileUrl: string;
  verified: boolean;
  createdAt: string;
}
