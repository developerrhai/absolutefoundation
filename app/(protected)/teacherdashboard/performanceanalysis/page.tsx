  "use client";

  import { useEffect, useMemo, useState } from "react";
  import { ArrowLeft, GraduationCap, Download, Loader2 } from "lucide-react";
  import { useRouter, useSearchParams } from "next/navigation";
  import { Button } from "../../../../components/ui/button";
  import { StudentProfile } from "../../../../components/performdashboard/student-profile";
  import { StatsCard } from "../../../../components/performdashboard/stats-card";
  import { PerformanceChart } from "../../../../components/performdashboard/performance-chart";
  import { SubjectMarksChart } from "../../../../components/performdashboard/subject-marks-chart";
  import { PerformanceInsights } from "../../../../components/performdashboard/insights-card";
  import { DetailedAnalysis } from "../../../../components/performdashboard/detailed-analysis";
  import { studentData } from "../../../../lib/student-data";
  import { studentsUniversalApi, teacherStudentAssessmentsApi } from "../../../../lib/api";

  export const dynamic = "force-dynamic";

  type Student = {
    id: number;
    name: string;
    phone: string;
    standard: string;
    board: string;
    location: string;
  };

  type AssessmentRow = {
    subject: string;
    marks: number;
    examination: string;
    exam_date: string;
  };

  type DashboardData = {
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
    subjects: Array<{
      name: string;
      marks: number;
      total: number;
      color: string;
    }>;
    performanceData: Array<{
      subject: string;
      thisTerm: number;
      lastTerm: number;
    }>;
  };

  const SUBJECT_COLORS = [
    "#22c55e",
    "#3b82f6",
    "#eab308",
    "#8b5cf6",
    "#f97316",
    "#06b6d4",
    "#ef4444",
    "#84cc16",
  ];

  function toNum(value: unknown) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function buildDashboardData(
    student: Student,
    rows: AssessmentRow[],
    totalStudents: number
  ): DashboardData {
    const subjectMap = new Map<
      string,
      { latest?: AssessmentRow; previous?: AssessmentRow }
    >();

    for (const row of rows) {
      if (!row?.subject) continue;
      const key = row.subject.trim();
      if (!key) continue;

      if (!subjectMap.has(key)) {
        subjectMap.set(key, { latest: row });
      } else {
        const current = subjectMap.get(key)!;
        if (!current.previous) current.previous = row;
      }
    }

    const subjects = Array.from(subjectMap.entries()).map(([name, value], index) => {
      const marks = toNum(value.latest?.marks);
      return {
        name,
        marks,
        total: 100,
        color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
      };
    });

    const thisTermTotal = subjects.reduce((sum, s) => sum + s.marks, 0);
    const thisTermCount = subjects.length;
    const averageMarks = thisTermCount > 0 ? thisTermTotal / thisTermCount : 0;

    const previousTermMarks = Array.from(subjectMap.values()).map((value) =>
      toNum(value.previous?.marks)
    );
    const prevCount = previousTermMarks.filter((m) => m > 0).length;
    const prevAverage =
      prevCount > 0
        ? previousTermMarks.reduce((sum, mark) => sum + mark, 0) / prevCount
        : 0;

    const overallPercentage = Number(averageMarks.toFixed(1));
    const averageChange = Number((averageMarks - prevAverage).toFixed(1));
    const percentageChange = averageChange;

    const performanceData = Array.from(subjectMap.entries()).map(([subject, value]) => ({
      subject,
      thisTerm: toNum(value.latest?.marks),
      lastTerm: toNum(value.previous?.marks),
    }));

    return {
      name: student.name || studentData.name,
      phone: student.phone || studentData.phone,
      class: student.standard || studentData.class,
      board: student.board || studentData.board,
      location: student.location || studentData.location,
      stats: {
        overallPercentage,
        percentageChange,
        averageMarks: Number(averageMarks.toFixed(1)),
        totalMarks: 100,
        averageChange,
        classRank: 1,
        totalStudents: Math.max(totalStudents, 1),
        rankChange: 0,
        attendance: 0,
        attendanceChange: 0,
      },
      subjects: subjects.length > 0 ? subjects : studentData.subjects,
      performanceData:
        performanceData.length > 0 ? performanceData : studentData.performanceData,
    };
  }

  export default function StudentPerformanceDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [dashboardData, setDashboardData] = useState<DashboardData>(studentData);
    const [loading, setLoading] = useState(true);
    const [studentLoading, setStudentLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedStudent = useMemo(
      () => students.find((s) => s.id === selectedStudentId) ?? null,
      [students, selectedStudentId]
    );
    const preferredStudentId = Number(searchParams.get("studentId"));

    useEffect(() => {
      const loadStudents = async () => {
        setLoading(true);
        setError(null);
        try {
          const studentsRes: any = await studentsUniversalApi.getAll();
          const allStudents: Student[] = (studentsRes?.data || []).map((s: any) => ({
            id: Number(s.id),
            name: s.name || "",
            phone: s.phone || "",
            standard: s.standard || "",
            board: s.board || "",
            location: s.location || "",
          }));

          setStudents(allStudents);
          if (allStudents.length > 0) {
            const queryMatch = allStudents.find((s) => s.id === preferredStudentId);
            setSelectedStudentId(queryMatch ? queryMatch.id : allStudents[0].id);
          } else {
            setDashboardData(studentData);
          }
        } catch (e: any) {
          setError(e?.message || "Failed to load students");
        } finally {
          setLoading(false);
        }
      };

      loadStudents();
    }, [preferredStudentId]);

    useEffect(() => {
      if (!students.length) return;
      if (!Number.isFinite(preferredStudentId)) return;
      const queryMatch = students.find((s) => s.id === preferredStudentId);
      if (queryMatch && queryMatch.id !== selectedStudentId) {
        setSelectedStudentId(queryMatch.id);
      }
    }, [preferredStudentId, students, selectedStudentId]);

    const handleStudentChange = (id: number) => {
      setSelectedStudentId(id);
      router.replace(`/teacherdashboard/performanceanalysis?studentId=${id}`);
    };

    useEffect(() => {
      if (!selectedStudent) return;

      const loadStudentPerformance = async () => {
        setStudentLoading(true);
        setError(null);
        try {
          const assessmentRes: any = await teacherStudentAssessmentsApi.getByStudent(
            selectedStudent.id
          );
          const rows: AssessmentRow[] = assessmentRes?.data || [];
          setDashboardData(buildDashboardData(selectedStudent, rows, students.length));
        } catch (e: any) {
          setError(e?.message || "Failed to load performance data");
        } finally {
          setStudentLoading(false);
        }
      };

      loadStudentPerformance();
    }, [selectedStudent, students.length]);

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="rounded-lg p-2 hover:bg-slate-200 transition-colors">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-teal-600" />
                <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
                  Student Performance Analysis
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedStudentId ?? ""}
                onChange={(e) => handleStudentChange(Number(e.target.value))}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                disabled={loading || students.length === 0}
              >
                {students.length === 0 ? (
                  <option value="">No students</option>
                ) : (
                  students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || `Student ${s.id}`}
                    </option>
                  ))
                )}
              </select>
              <Button className="bg-teal-500 hover:bg-teal-600 text-white gap-2 shadow-md">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download Report</span>
            </Button>
            </div>
          </div>

          {/* Main Card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            {(loading || studentLoading) && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading dashboard data...
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Student Info and Stats */}
            <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <StudentProfile
                name={dashboardData.name}
                phone={dashboardData.phone}
                className={dashboardData.class}
                board={dashboardData.board}
                location={dashboardData.location}
              />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatsCard
                  title="Overall Percentage"
                  value={`${dashboardData.stats.overallPercentage}%`}
                  change={dashboardData.stats.percentageChange}
                  changeLabel="vs Last Term"
                  icon="percentage"
                />
                <StatsCard
                  title="Average Marks"
                  value={dashboardData.stats.averageMarks}
                  subValue={`/ ${dashboardData.stats.totalMarks}`}
                  change={dashboardData.stats.averageChange}
                  changeLabel="vs Last Term"
                  icon="star"
                />
                <StatsCard
                  title="Class Rank"
                  value={dashboardData.stats.classRank}
                  subValue={`/ ${dashboardData.stats.totalStudents}`}
                  change={dashboardData.stats.rankChange}
                  changeLabel="vs Last Term"
                  icon="rank"
                />
                <StatsCard
                  title="Attendance"
                  value={`${dashboardData.stats.attendance}%`}
                  change={dashboardData.stats.attendanceChange}
                  changeLabel="vs Last Term"
                  icon="attendance"
                />
              </div>
            </div>

            {/* Charts Section */}
            <div className="mb-6 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <PerformanceChart data={dashboardData.performanceData} />
              </div>
              <div className="lg:col-span-1">
                <SubjectMarksChart
                  subjects={dashboardData.subjects}
                  average={dashboardData.stats.overallPercentage}
                />
              </div>
              <div className="lg:col-span-1">
                <PerformanceInsights />
              </div>
            </div>

            {/* Detailed Analysis Table */}
            <DetailedAnalysis subjects={dashboardData.subjects} />
          </div>
        </div>
      </div>
    );
  }
