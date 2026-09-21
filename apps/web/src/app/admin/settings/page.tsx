"use client";

import { PageHeader } from "@/features/dashboard/components/page-header";
import { TwoFactorSettings } from "@/features/auth/components/two-factor-settings";
import { useAuthStore } from "@/features/auth/store/auth-store";

export default function AdminSettingsPage() {
  const authUser = useAuthStore((state) => state.user);

  if (!authUser) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Admin accounts require two-factor authentication to access admin routes."
      />
      <TwoFactorSettings user={authUser} />
    </div>
  );
}
