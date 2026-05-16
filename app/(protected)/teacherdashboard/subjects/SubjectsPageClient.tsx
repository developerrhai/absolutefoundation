"use client";

import { DashboardShell } from "@/components/teacher/DashboardShell";
import StudentManagementContent from "@/components/teacher/StudentManagementContent";

export default function SubjectsPageClient() {
  return (
    <DashboardShell title="Student Management">
      <StudentManagementContent />
    </DashboardShell>
  );
}
