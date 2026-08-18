import { ProDashboardShell } from "@/features/pro-dashboard/components/pro-dashboard-shell";

export default function ProDashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProDashboardShell>{children}</ProDashboardShell>;
}
