export function getGrade(percentage: number) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  return "D";
}

export function getPerformanceLabel(percentage: number) {
  if (percentage >= 90) return { label: "Excellent", color: "bg-emerald-100 text-emerald-700" };
  if (percentage >= 80) return { label: "Very Good", color: "bg-sky-100 text-sky-700" };
  if (percentage >= 70) return { label: "Good", color: "bg-cyan-100 text-cyan-700" };
  if (percentage >= 60) return { label: "Needs Improvement", color: "bg-amber-100 text-amber-700" };
  return { label: "At Risk", color: "bg-rose-100 text-rose-700" };
}
