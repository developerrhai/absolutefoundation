export const SUBJECT_COLORS = [
  "#22c55e", "#3b82f6", "#eab308", "#8b5cf6",
  "#f97316", "#06b6d4", "#ef4444", "#84cc16",
];

export type AssessmentRow = {
  id?: number;
  subject: string;
  marks: number;
  total_marks?: number;
  examination: string;
  exam_date: string;
};

export type DashboardSubject = {
  name: string;
  marks: number;
  total: number;
  color: string;
};

export type DashboardData = {
  name: string;
  phone: string;
  class: string;
  board: string;
  location: string;
  stats: {
    overallPercentage: number;
    percentageChange: number;
    averageMarks: number;
    totalMarks: number;
    averageChange: number;
    classRank: number;
    totalStudents: number;
    rankChange: number;
    attendance: number;
    attendanceChange: number;
  };
  subjects: DashboardSubject[];
  performanceData: Array<{ subject: string; thisTerm: number; lastTerm: number }>;
};

export type InsightItem = {
  type: "success" | "info" | "warning" | "tip";
  title: string;
  description: string;
};

export function toNum(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function pct(marks: number, total: number) {
  if (total <= 0) return 0;
  return (marks / total) * 100;
}

export type PerformanceExtras = {
  totalStudents?: number;
  classRank?: number;
  rankChange?: number;
  attendance?: number;
  attendanceChange?: number;
};

export function parseAttendanceExtras(
  rows: Array<{ attendance_percentage?: number }>
): Pick<PerformanceExtras, "attendance" | "attendanceChange"> {
  if (!rows.length) return { attendance: 0, attendanceChange: 0 };
  const latest = Number(rows[0].attendance_percentage) || 0;
  const prev = rows[1] ? Number(rows[1].attendance_percentage) || 0 : null;
  return {
    attendance: Number(latest.toFixed(1)),
    attendanceChange:
      prev !== null ? Number((latest - prev).toFixed(1)) : 0,
  };
}

export function parseRankExtras(
  rows: Array<{ class_rank?: number; total_students?: number }>,
  fallbackTotal = 1
): Pick<PerformanceExtras, "classRank" | "totalStudents" | "rankChange"> {
  if (!rows.length) {
    return { classRank: 0, totalStudents: fallbackTotal, rankChange: 0 };
  }
  const latest = rows[0];
  const prev = rows[1];
  const classRank = Number(latest.class_rank) || 0;
  const totalStudents = Number(latest.total_students) || fallbackTotal;
  const rankChange =
    prev && prev.class_rank
      ? Number(prev.class_rank) - classRank
      : 0;
  return { classRank, totalStudents, rankChange };
}

export function applyPerformanceExtras(
  data: DashboardData,
  extras: PerformanceExtras
): DashboardData {
  return {
    ...data,
    stats: {
      ...data.stats,
      classRank: extras.classRank ?? data.stats.classRank,
      totalStudents: extras.totalStudents ?? data.stats.totalStudents,
      rankChange: extras.rankChange ?? data.stats.rankChange,
      attendance: extras.attendance ?? data.stats.attendance,
      attendanceChange: extras.attendanceChange ?? data.stats.attendanceChange,
    },
  };
}

export function buildDashboardData(
  student: { name: string; phone: string; standard: string; board: string; location: string },
  rows: AssessmentRow[],
  options: PerformanceExtras & { totalStudents: number } = { totalStudents: 1 }
): DashboardData {
  const subjectMap = new Map<string, AssessmentRow[]>();

  for (const row of rows) {
    if (!row?.subject) continue;
    const key = row.subject.trim();
    if (!key) continue;
    const list = subjectMap.get(key) || [];
    list.push(row);
    subjectMap.set(key, list);
  }

  for (const list of subjectMap.values()) {
    list.sort((a, b) => {
      const da = new Date(a.exam_date).getTime();
      const db = new Date(b.exam_date).getTime();
      if (db !== da) return db - da;
      return (b.id ?? 0) - (a.id ?? 0);
    });
  }

  const subjects: DashboardSubject[] = [];
  const performanceData: DashboardData["performanceData"] = [];

  let index = 0;
  for (const [name, subjectRows] of subjectMap.entries()) {
    const latest = subjectRows[0];
    const previous = subjectRows[1];
    const total = toNum(latest?.total_marks) > 0 ? toNum(latest.total_marks) : 100;
    const marks = toNum(latest?.marks);

    subjects.push({
      name,
      marks,
      total,
      color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
    });
    performanceData.push({
      subject: name,
      thisTerm: marks,
      lastTerm: toNum(previous?.marks),
    });
    index += 1;
  }

  const percentages = subjects.map((s) => pct(s.marks, s.total));
  const overallPercentage =
    percentages.length > 0
      ? Number((percentages.reduce((a, b) => a + b, 0) / percentages.length).toFixed(1))
      : 0;

  const prevPcts = performanceData
    .filter((p) => p.lastTerm > 0)
    .map((p) => p.lastTerm);
  const prevAvg =
    prevPcts.length > 0 ? prevPcts.reduce((a, b) => a + b, 0) / prevPcts.length : 0;
  const averageChange = Number((overallPercentage - prevAvg).toFixed(1));

  const averageMarks =
    subjects.length > 0
      ? Number((subjects.reduce((sum, s) => sum + s.marks, 0) / subjects.length).toFixed(1))
      : 0;

  const maxTotal = subjects.reduce((max, s) => Math.max(max, s.total), 100);

  return {
    name: student.name || "Student",
    phone: student.phone || "",
    class: student.standard || "",
    board: student.board || "",
    location: student.location || "",
    stats: {
      overallPercentage,
      percentageChange: averageChange,
      averageMarks,
      totalMarks: maxTotal,
      averageChange,
      classRank: options.classRank ?? 0,
      totalStudents: Math.max(options.totalStudents, 1),
      rankChange: options.rankChange ?? 0,
      attendance: options.attendance ?? 0,
      attendanceChange: options.attendanceChange ?? 0,
    },
    subjects,
    performanceData,
  };
}

export function buildInsights(data: DashboardData): InsightItem[] {
  const insights: InsightItem[] = [];

  if (data.subjects.length === 0) {
    return [
      {
        type: "tip",
        title: "No marks yet",
        description: "Use Add Marks to record test results. Charts and insights will update automatically.",
      },
    ];
  }

  const change = data.stats.percentageChange;
  if (change > 0) {
    insights.push({
      type: "success",
      title: "Improving",
      description: `Overall performance is up by ${Math.abs(change)} points compared to the previous term for tracked subjects.`,
    });
  } else if (change < 0) {
    insights.push({
      type: "warning",
      title: "Needs attention",
      description: `Performance dipped by ${Math.abs(change)} points vs the previous term. Review weaker subjects below.`,
    });
  } else {
    insights.push({
      type: "info",
      title: "Stable performance",
      description: "Marks are consistent with the previous term across recorded subjects.",
    });
  }

  const ranked = [...data.subjects].sort(
    (a, b) => pct(b.marks, b.total) - pct(a.marks, a.total)
  );
  if (ranked.length >= 1) {
    const top = ranked.slice(0, Math.min(2, ranked.length)).map((s) => s.name);
    insights.push({
      type: "info",
      title: "Strong subjects",
      description: `${top.join(" and ")} ${top.length === 1 ? "is" : "are"} among the strongest areas right now.`,
    });
  }

  const weakest = ranked[ranked.length - 1];
  if (weakest && pct(weakest.marks, weakest.total) < 70) {
    insights.push({
      type: "warning",
      title: "Focus area",
      description: `Consider extra practice in ${weakest.name} (${Math.round(pct(weakest.marks, weakest.total))}%) to lift the overall average.`,
    });
  }

  if (data.stats.classRank > 0) {
    insights.push({
      type: "tip",
      title: "Class standing",
      description: `Rank ${data.stats.classRank} of ${data.stats.totalStudents} students (saved in rank history).`,
    });
  }

  if (data.stats.attendance > 0) {
    insights.push({
      type: data.stats.attendance >= 85 ? "success" : "warning",
      title: "Attendance",
      description: `Latest attendance is ${data.stats.attendance}%${
        data.stats.attendanceChange !== 0
          ? ` (${data.stats.attendanceChange > 0 ? "+" : ""}${data.stats.attendanceChange}% vs previous period)`
          : ""
      }.`,
    });
  }

  return insights.slice(0, 5);
}
