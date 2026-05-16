"use client";

import { DashboardShell } from "@/components/teacher/DashboardShell";
import StudentManagementContent from "@/components/teacher/StudentManagementContent";

/**
 * Student Management — uses client rendering (auth, API, dialogs).
 * Analyze action navigates to /teacherdashboard/performanceanalysis?studentId=
 */
export default function SubjectsPage() {
  return (
    <DashboardShell title="Student Management">
      <StudentManagementContent />
    </DashboardShell>
  );
}
