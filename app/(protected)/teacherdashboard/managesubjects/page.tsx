import { DashboardShell } from "@/components/teacher/DashboardShell";
import { ManageWizard } from "@/components/teacher/ManageWizard";
import { Toaster } from "@/components/ui/sonner";

export default function ManageSubjectsPage() {
  return (
    <DashboardShell title="Notes">
      <ManageWizard />
      <Toaster richColors position="top-center" />
    </DashboardShell>
  );
}
