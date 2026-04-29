import { DashboardShell } from "@/components/teacher/DashboardShell";
import { StudentManagementContent } from "@/components/teacher/StudentManagementContent";

export default function SubjectsPage() {
  return (
    // <DashboardShell title="Subjects">
    //   <div className="rounded-2xl bg-card border border-border p-6">
    //     <h2 className="text-xl font-semibold">Subjects</h2>
    //     <p className="text-sm text-muted-foreground mt-2">
    //       Subject management page is ready for your next feature implementation.
    //     </p>
    //   </div>
        <DashboardShell title="Student Management">
      <StudentManagementContent />
    </DashboardShell>
  );
}
