import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Performance Analysis | Absolute Foundation",
  description: "Student performance dashboard with marks, attendance, and rank history",
};

/** Nested layout only — no <html>/<body> (handled by app/(protected)/layout.tsx) */
export default function PerformanceAnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
