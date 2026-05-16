import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Dnyansagar Classes - Teacher Dashboard",
  description: "Teacher management dashboard",
};

/** Teacher dashboard segment layout — no duplicate <html>/<body> */
export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
