import { PageHeader } from "@/features/dashboard/components/page-header";
import { ProfileForm } from "@/features/professional-profile/components/profile-form";

export default function ProProfilePage() {
  return (
    <div>
      <PageHeader title="Business profile" description="This is what clients see when they view your listing." />
      <ProfileForm />
    </div>
  );
}
