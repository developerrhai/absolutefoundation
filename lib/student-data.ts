<<<<<<< HEAD
export function getGrade(percentage: number) {
=======
export const studentData = {
  name: "Soham",
  phone: "9854785412",
  class: "9",
  board: "ICSE",
  location: "Wakad",
  avatar: "/student-avatar.png",
  stats: {
    overallPercentage: 88.4,
    percentageChange: 5.6,
    averageMarks: 88.4,
    totalMarks: 100,
    averageChange: 4.8,
    classRank: 5,
    totalStudents: 45,
    rankChange: 3,
    attendance: 92,
    attendanceChange: 2,
  },
  subjects: [
    { name: "Mathematics", marks: 92, total: 100, color: "#22c55e" },
    { name: "Science", marks: 85, total: 100, color: "#3b82f6" },
    { name: "English", marks: 88, total: 100, color: "#eab308" },
    { name: "Social Studies", marks: 78, total: 100, color: "#8b5cf6" },
    { name: "Hindi", marks: 90, total: 100, color: "#f97316" },
  ],
  performanceData: [
    { subject: "Mathematics", thisTerm: 92, lastTerm: 78 },
    { subject: "Science", thisTerm: 85, lastTerm: 72 },
    { subject: "English", thisTerm: 88, lastTerm: 80 },
    { subject: "Social Studies", thisTerm: 78, lastTerm: 70 },
    { subject: "Hindi", thisTerm: 90, lastTerm: 82 },
  ],
};

export const getGrade = (percentage: number): string => {
>>>>>>> 831a8db (fixed login API issue)
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  return "D";
<<<<<<< HEAD
}

export function getPerformanceLabel(percentage: number) {
  if (percentage >= 90) return { label: "Excellent", color: "bg-emerald-100 text-emerald-700" };
  if (percentage >= 80) return { label: "Very Good", color: "bg-sky-100 text-sky-700" };
  if (percentage >= 70) return { label: "Good", color: "bg-cyan-100 text-cyan-700" };
  if (percentage >= 60) return { label: "Needs Improvement", color: "bg-amber-100 text-amber-700" };
  return { label: "At Risk", color: "bg-rose-100 text-rose-700" };
}
=======
};

export const getPerformanceLabel = (percentage: number): { label: string; color: string } => {
  if (percentage >= 90) return { label: "Excellent", color: "bg-emerald-100 text-emerald-700" };
  if (percentage >= 80) return { label: "Very Good", color: "bg-sky-100 text-sky-700" };
  if (percentage >= 70) return { label: "Good", color: "bg-amber-100 text-amber-700" };
  if (percentage >= 60) return { label: "Average", color: "bg-orange-100 text-orange-700" };
  return { label: "Needs Improvement", color: "bg-red-100 text-red-700" };
};
>>>>>>> 831a8db (fixed login API issue)
