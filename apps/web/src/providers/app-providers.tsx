import { Toaster } from "@/components/ui/sonner";
import { AuthBootstrap } from "@/features/auth/components/auth-bootstrap";
import { QueryProvider } from "./query-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthBootstrap />
      {children}
      <Toaster position="top-center" richColors />
    </QueryProvider>
  );
}
