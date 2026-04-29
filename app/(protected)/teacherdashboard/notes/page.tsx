import { DashboardShell } from "@/components/teacher/DashboardShell";
import { NotesWizard } from "@/components/teacher/NotesWizard";
import { Toaster } from "@/components/ui/sonner";

export default function NotesPage() {
  return (
    <DashboardShell title="Notes">
      <NotesWizard />
      <Toaster richColors position="top-center" />
    </DashboardShell>
  );
}
