"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, GraduationCap, Download, Loader2, MessageCircle, Send } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import { StudentProfile } from "../performdashboard/student-profile";
import { StatsCard } from "../performdashboard/stats-card";
import { PerformanceChart } from "../performdashboard/performance-chart";
import { SubjectMarksChart } from "../performdashboard/subject-marks-chart";
import { PerformanceInsights } from "../performdashboard/insights-card";
import { DetailedAnalysis } from "../performdashboard/detailed-analysis";
import { studentData } from "../../lib/student-data";
import { studentsUniversalApi, teacherStudentAssessmentsApi } from "../../lib/api";

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
  subjects: Array<{ name: string; marks: number; total: number; color: string }>;
  performanceData: Array<{ subject: string; thisTerm: number; lastTerm: number }>;
};

// ─── Bulk send result tracking ────────────────────────────────────────────────
type BulkResult = {
  studentName: string;
  phone: string;
  status: "success" | "failed" | "skipped";
  reason?: string;
};

const SUBJECT_COLORS = [
  "#22c55e","#3b82f6","#eab308","#8b5cf6",
  "#f97316","#06b6d4","#ef4444","#84cc16",
];

function toNum(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getPerformanceLabel(pct: number): string {
  if (pct >= 90) return "Excellent 🌟";
  if (pct >= 75) return "Very Good 👍";
  if (pct >= 60) return "Good ✅";
  if (pct >= 50) return "Average 📘";
  return "Needs Improvement 📚";
}

function buildDashboardData(
  student: Student,
  rows: AssessmentRow[],
  totalStudents: number
): DashboardData {
  const subjectMap = new Map<string, { latest?: AssessmentRow; previous?: AssessmentRow }>();

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

  const subjects = Array.from(subjectMap.entries()).map(([name, value], index) => ({
    name,
    marks: toNum(value.latest?.marks),
    total: 100,
    color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
  }));

  const thisTermTotal = subjects.reduce((sum, s) => sum + s.marks, 0);
  const thisTermCount = subjects.length;
  const averageMarks = thisTermCount > 0 ? thisTermTotal / thisTermCount : 0;

  const previousTermMarks = Array.from(subjectMap.values()).map((v) => toNum(v.previous?.marks));
  const prevCount = previousTermMarks.filter((m) => m > 0).length;
  const prevAverage = prevCount > 0
    ? previousTermMarks.reduce((sum, mark) => sum + mark, 0) / prevCount : 0;

  const overallPercentage = Number(averageMarks.toFixed(1));
  const averageChange = Number((averageMarks - prevAverage).toFixed(1));

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
      percentageChange: averageChange,
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
    performanceData: performanceData.length > 0 ? performanceData : studentData.performanceData,
  };
}

// ─── RhaiTech WhatsApp API call ───────────────────────────────────────────────

async function sendWhatsAppViaAPI(
  phone: string,
  studentName: string,
  className: string,
  examination: string,
  examDate: string,
  marks: number,
  totalMarks: number,
  performance: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/whatsapp/send-report`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          studentName,
          className,
          examination,
          examDate,
          marks,
          totalMarks,
          performance,
        }),
      }
    );

    const json = await res.json();
    return { success: json.success, message: json.message };
  } catch (e: any) {
    return { success: false, message: e?.message || "Network error" };
  }
}

// ─── Report HTML builder ──────────────────────────────────────────────────────

function generateReportHTML(data: DashboardData): string {
  const generatedOn = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const subjectRows = data.subjects.map((s) => {
    const pct = ((s.marks / s.total) * 100).toFixed(1);
    const pctNum = Number(pct);
    const grade =
      pctNum >= 90 ? "A+" : pctNum >= 80 ? "A" : pctNum >= 70 ? "B+" :
      pctNum >= 60 ? "B" : pctNum >= 50 ? "C" : "D";
    const barW = Math.max(0, Math.min(100, pctNum));
    const badgeBg = pctNum >= 75 ? "#dcfce7" : pctNum >= 50 ? "#fef9c3" : "#fee2e2";
    const badgeFg = pctNum >= 75 ? "#15803d" : pctNum >= 50 ? "#854d0e" : "#b91c1c";
    return `
      <tr>
        <td style="padding:10px 12px;font-weight:500;color:#1e293b">${s.name}</td>
        <td style="padding:10px 12px;text-align:center;color:#475569">${s.marks}</td>
        <td style="padding:10px 12px;text-align:center;color:#475569">${s.total}</td>
        <td style="padding:10px 12px;text-align:center;color:#475569">${pct}%</td>
        <td style="padding:10px 12px;text-align:center">
          <span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:12px;
            font-weight:700;background:${badgeBg};color:${badgeFg}">${grade}</span>
        </td>
        <td style="padding:10px 12px">
          <div style="background:#e2e8f0;border-radius:4px;height:8px;width:100%;min-width:80px">
            <div style="background:${s.color};height:8px;border-radius:4px;width:${barW}%"></div>
          </div>
        </td>
      </tr>`;
  }).join("");

  const compRows = data.performanceData.map((p) => {
    const diff = p.thisTerm - p.lastTerm;
    const arrow = diff > 0 ? "&#9650;" : diff < 0 ? "&#9660;" : "&#8212;";
    const color = diff > 0 ? "#16a34a" : diff < 0 ? "#dc2626" : "#94a3b8";
    return `
      <tr>
        <td style="padding:10px 12px;font-weight:500;color:#1e293b">${p.subject}</td>
        <td style="padding:10px 12px;text-align:center;color:#475569">${p.lastTerm}</td>
        <td style="padding:10px 12px;text-align:center;color:#475569">${p.thisTerm}</td>
        <td style="padding:10px 12px;text-align:center;font-weight:700;color:${color}">
          ${arrow} ${Math.abs(diff)}
        </td>
      </tr>`;
  }).join("");

  const changeClass = (v: number) => (v >= 0 ? "change-pos" : "change-neg");
  const arrowHTML = (v: number) => (v >= 0 ? "&#9650;" : "&#9660;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Performance Report – ${data.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0 }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1e293b; font-size: 14px }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact } .no-print { display: none } }
    .page { max-width: 900px; margin: 0 auto; padding: 40px 36px }
    .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 20px; border-bottom: 3px solid #0d9488; margin-bottom: 28px }
    .header-left h1 { font-size: 22px; font-weight: 700; color: #0d9488 }
    .header-left p { font-size: 12px; color: #94a3b8; margin-top: 2px }
    .header-badge { background: #0d9488; color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600 }
    .profile-card { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 20px 24px; display: flex; gap: 32px; flex-wrap: wrap; margin-bottom: 24px }
    .profile-field label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .5px }
    .profile-field p { font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 2px }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px }
    .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center }
    .stat-box .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .5px }
    .stat-box .value { font-size: 26px; font-weight: 700; color: #0f172a; margin: 4px 0 2px }
    .stat-box .sub { font-size: 12px; color: #94a3b8 }
    .change-pos { font-size: 12px; color: #16a34a; font-weight: 600 }
    .change-neg { font-size: 12px; color: #dc2626; font-weight: 600 }
    .section-title { font-size: 14px; font-weight: 700; color: #0f172a; border-left: 4px solid #0d9488; padding-left: 10px; margin: 24px 0 14px }
    table { width: 100%; border-collapse: collapse; font-size: 13px }
    thead tr { background: #f1f5f9 }
    thead th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #64748b; font-weight: 600 }
    tbody tr:nth-child(even) { background: #f8fafc }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8 }
    .print-btn { display: block; margin: 0 auto 28px; padding: 10px 28px; background: #0d9488; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer }
  </style>
</head>
<body>
<div class="page">
  <button class="print-btn no-print" onclick="window.print()">&#128438; Print / Save as PDF</button>
  <div class="header">
    <div class="header-left"><h1>Student Performance Report</h1><p>Generated on ${generatedOn}</p></div>
    <span class="header-badge">Academic Report</span>
  </div>
  <div class="profile-card">
    <div class="profile-field"><label>Student Name</label><p>${data.name}</p></div>
    <div class="profile-field"><label>Class / Standard</label><p>${data.class}</p></div>
    <div class="profile-field"><label>Board</label><p>${data.board}</p></div>
    <div class="profile-field"><label>Location</label><p>${data.location}</p></div>
    <div class="profile-field"><label>Contact</label><p>${data.phone}</p></div>
  </div>
  <div class="section-title">Performance Overview</div>
  <div class="stats-grid">
    <div class="stat-box"><div class="label">Overall %</div><div class="value">${data.stats.overallPercentage}%</div>
      <div class="${changeClass(data.stats.percentageChange)}">${arrowHTML(data.stats.percentageChange)} ${Math.abs(data.stats.percentageChange)}% vs Last Term</div></div>
    <div class="stat-box"><div class="label">Avg Marks</div><div class="value">${data.stats.averageMarks}</div><div class="sub">out of ${data.stats.totalMarks}</div></div>
    <div class="stat-box"><div class="label">Class Rank</div><div class="value">${data.stats.classRank}</div><div class="sub">of ${data.stats.totalStudents} students</div></div>
    <div class="stat-box"><div class="label">Attendance</div><div class="value">${data.stats.attendance}%</div>
      <div class="${changeClass(data.stats.attendanceChange)}">${arrowHTML(data.stats.attendanceChange)} ${Math.abs(data.stats.attendanceChange)}% vs Last Term</div></div>
  </div>
  <div class="section-title">Subject-wise Performance</div>
  <table>
    <thead><tr><th>Subject</th><th style="text-align:center">Marks</th><th style="text-align:center">Total</th><th style="text-align:center">Percentage</th><th style="text-align:center">Grade</th><th>Progress</th></tr></thead>
    <tbody>${subjectRows}</tbody>
  </table>
  ${compRows ? `<div class="section-title">Term-over-Term Comparison</div>
  <table><thead><tr><th>Subject</th><th style="text-align:center">Last Term</th><th style="text-align:center">This Term</th><th style="text-align:center">Change</th></tr></thead>
  <tbody>${compRows}</tbody></table>` : ""}
  <div class="footer"><span>Student Performance Analysis System</span><span>Report for ${data.name} &nbsp;|&nbsp; ${generatedOn}</span></div>
</div></body></html>`;
}

async function downloadReport(data: DashboardData) {
  const html = generateReportHTML(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) { win.focus(); setTimeout(() => URL.revokeObjectURL(url), 10_000); }
  else {
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${data.name.replace(/\s+/g, "-").toLowerCase()}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5_000);
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StudentPerformanceDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>(studentData);
  const [loading, setLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Bulk send state ────────────────────────────────────────────────────────
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
  const [showBulkResults, setShowBulkResults] = useState(false);
  // Raw assessments cache per student: studentId → rows
  const [assessmentCache, setAssessmentCache] = useState<Map<number, AssessmentRow[]>>(new Map());

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId]
  );
  const preferredStudentId = Number(searchParams.get("studentId"));

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true); setError(null);
      try {
        const studentsRes: any = await studentsUniversalApi.getAll();
        const allStudents: Student[] = (studentsRes?.data || []).map((s: any) => ({
          id: Number(s.id), name: s.name || "", phone: s.phone || "",
          standard: s.standard || "", board: s.board || "", location: s.location || "",
        }));
        setStudents(allStudents);
        if (allStudents.length > 0) {
          const queryMatch = allStudents.find((s) => s.id === preferredStudentId);
          setSelectedStudentId(queryMatch ? queryMatch.id : allStudents[0].id);
        } else { setDashboardData(studentData); }
      } catch (e: any) { setError(e?.message || "Failed to load students"); }
      finally { setLoading(false); }
    };
    loadStudents();
  }, [preferredStudentId]);

  useEffect(() => {
    if (!students.length || !Number.isFinite(preferredStudentId)) return;
    const queryMatch = students.find((s) => s.id === preferredStudentId);
    if (queryMatch && queryMatch.id !== selectedStudentId) setSelectedStudentId(queryMatch.id);
  }, [preferredStudentId, students, selectedStudentId]);

  const handleStudentChange = (id: number) => {
    setSelectedStudentId(id);
    router.replace(`/teacherdashboard/performanceanalysis?studentId=${id}`);
  };

  const handleDownloadReport = async () => {
    setDownloading(true);
    try { await downloadReport(dashboardData); }
    finally { setDownloading(false); }
  };

  useEffect(() => {
    if (!selectedStudent) return;
    const loadStudentPerformance = async () => {
      setStudentLoading(true); setError(null);
      try {
        const assessmentRes: any = await teacherStudentAssessmentsApi.getByStudent(selectedStudent.id);
        const rows: AssessmentRow[] = assessmentRes?.data || [];
        // Cache raw rows for bulk send
        setAssessmentCache((prev) => new Map(prev).set(selectedStudent.id, rows));
        setDashboardData(buildDashboardData(selectedStudent, rows, students.length));
      } catch (e: any) { setError(e?.message || "Failed to load performance data"); }
      finally { setStudentLoading(false); }
    };
    loadStudentPerformance();
  }, [selectedStudent, students.length]);

  // ── Bulk Send Handler ──────────────────────────────────────────────────────
  const handleBulkSend = async () => {
    if (bulkSending) return;
    const confirm = window.confirm(
      `Send WhatsApp report to all ${students.length} students?\n\nThis will send the latest test result for each student via the marks_update template.`
    );
    if (!confirm) return;

    setBulkSending(true);
    setBulkProgress(0);
    setBulkTotal(students.length);
    setBulkResults([]);
    setShowBulkResults(false);
    setError(null);

    const results: BulkResult[] = [];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      setBulkProgress(i + 1);

      // Skip if no phone
      if (!student.phone?.trim()) {
        results.push({ studentName: student.name, phone: "—", status: "skipped", reason: "No phone number" });
        continue;
      }

      try {
        // Fetch assessments (use cache if already loaded)
        let rows: AssessmentRow[] = assessmentCache.get(student.id) || [];
        if (!rows.length) {
          const res: any = await teacherStudentAssessmentsApi.getByStudent(student.id);
          rows = res?.data || [];
          setAssessmentCache((prev) => new Map(prev).set(student.id, rows));
        }

        if (!rows.length) {
          results.push({ studentName: student.name, phone: student.phone, status: "skipped", reason: "No assessment data" });
          continue;
        }

        // Get latest assessment row
        const latest = rows[0];
        const pct = toNum(latest.marks);
        const performance = getPerformanceLabel(pct);
        const examDate = latest.exam_date
          ? new Date(latest.exam_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
          : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

        const result = await sendWhatsAppViaAPI(
          student.phone,
          student.name,
          student.standard,
          latest.examination || "Weekly Test",
          examDate,
          toNum(latest.marks),
          100,
          performance
        );

        results.push({
          studentName: student.name,
          phone: student.phone,
          status: result.success ? "success" : "failed",
          reason: result.success ? undefined : result.message,
        });

        // Small delay between API calls to avoid rate limiting
        await new Promise((r) => setTimeout(r, 300));

      } catch (e: any) {
        results.push({ studentName: student.name, phone: student.phone, status: "failed", reason: e?.message || "Unknown error" });
      }
    }

    setBulkResults(results);
    setBulkSending(false);
    setShowBulkResults(true);
  };

  const successCount = bulkResults.filter((r) => r.status === "success").length;
  const failedCount  = bulkResults.filter((r) => r.status === "failed").length;
  const skippedCount = bulkResults.filter((r) => r.status === "skipped").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="rounded-lg p-2 hover:bg-slate-200 transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-teal-600" />
              <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">Student Performance Analysis</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
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
                  <option key={s.id} value={s.id}>{s.name || `Student ${s.id}`}</option>
                ))
              )}
            </select>

            {/* 📤 Bulk Send Button */}
            <Button
              onClick={handleBulkSend}
              disabled={bulkSending || loading || students.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-md disabled:opacity-60"
              title="Send latest test report to all students via WhatsApp"
            >
              {bulkSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">{bulkProgress}/{bulkTotal} Sending...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Bulk WhatsApp</span>
                </>
              )}
            </Button>

            {/* 📥 Download Button */}
            <Button
              onClick={handleDownloadReport}
              disabled={downloading || loading || studentLoading}
              className="bg-teal-500 hover:bg-teal-600 text-white gap-2 shadow-md disabled:opacity-60"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span className="hidden sm:inline">{downloading ? "Preparing..." : "Download Report"}</span>
            </Button>
          </div>
        </div>

        {/* ── Bulk Progress Bar ── */}
        {bulkSending && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-800 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending reports... {bulkProgress} of {bulkTotal}
              </span>
              <span className="text-sm text-green-600">{Math.round((bulkProgress / bulkTotal) * 100)}%</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(bulkProgress / bulkTotal) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Bulk Results Summary ── */}
        {showBulkResults && !bulkSending && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Summary bar */}
            <div className="flex items-center gap-4 p-4 border-b border-slate-100 flex-wrap">
              <span className="font-semibold text-slate-700">Bulk Send Complete</span>
              <span className="flex items-center gap-1 text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full">
                ✅ {successCount} Sent
              </span>
              <span className="flex items-center gap-1 text-sm text-red-700 bg-red-50 px-3 py-1 rounded-full">
                ❌ {failedCount} Failed
              </span>
              <span className="flex items-center gap-1 text-sm text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full">
                ⚠️ {skippedCount} Skipped
              </span>
              <button
                onClick={() => setShowBulkResults(false)}
                className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Dismiss
              </button>
            </div>

            {/* Detailed result table */}
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">Student</th>
                    <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">Phone</th>
                    <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">Status</th>
                    <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkResults.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-2 font-medium text-slate-700">{r.studentName}</td>
                      <td className="px-4 py-2 text-slate-500">{r.phone}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold
                          ${r.status === "success" ? "bg-green-100 text-green-700" :
                            r.status === "failed"  ? "bg-red-100 text-red-700" :
                                                     "bg-yellow-100 text-yellow-700"}`}>
                          {r.status === "success" ? "✅ Sent" : r.status === "failed" ? "❌ Failed" : "⚠️ Skipped"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-400 text-xs">{r.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── Dashboard Card ── */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          {(loading || studentLoading) && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-700">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading dashboard data...
            </div>
          )}

          <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <StudentProfile
              name={dashboardData.name}
              phone={dashboardData.phone}
              className={dashboardData.class}
              board={dashboardData.board}
              location={dashboardData.location}
            />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatsCard title="Overall Percentage" value={`${dashboardData.stats.overallPercentage}%`}
                change={dashboardData.stats.percentageChange} changeLabel="vs Last Term" icon="percentage" />
              <StatsCard title="Average Marks" value={dashboardData.stats.averageMarks}
                subValue={`/ ${dashboardData.stats.totalMarks}`} change={dashboardData.stats.averageChange}
                changeLabel="vs Last Term" icon="star" />
              <StatsCard title="Class Rank" value={dashboardData.stats.classRank}
                subValue={`/ ${dashboardData.stats.totalStudents}`} change={dashboardData.stats.rankChange}
                changeLabel="vs Last Term" icon="rank" />
              <StatsCard title="Attendance" value={`${dashboardData.stats.attendance}%`}
                change={dashboardData.stats.attendanceChange} changeLabel="vs Last Term" icon="attendance" />
            </div>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1"><PerformanceChart data={dashboardData.performanceData} /></div>
            <div className="lg:col-span-1">
              <SubjectMarksChart subjects={dashboardData.subjects} average={dashboardData.stats.overallPercentage} />
            </div>
            <div className="lg:col-span-1"><PerformanceInsights /></div>
          </div>

          <DetailedAnalysis subjects={dashboardData.subjects} />
        </div>
      </div>
    </div>
  );
}