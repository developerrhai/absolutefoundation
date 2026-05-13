"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GraduationCap,
  Search,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  BarChart3,
  Download,
  Upload,
  FileJson,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/teacher/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/teacher/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/teacher/ui/table";
import { Button } from "@/components/teacher/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/teacher/ui/dialog";
import { Label } from "@/components/teacher/ui/label";
import { studentsApi, studentsUniversalApi, teacherStudentAssessmentsApi } from "@/lib/api";

type Student = {
  id: number;
  name: string;
  phone: string;
  father_phone?: string;
  subject?: string;
  marks?: number;
  examination?: string;
  exam_date?: string;
  standard: string;
  board: string;
  location: string;
};

type AssessmentRow = {
  id?: number;
  student_id: number;
  subject: string;
  marks: number;
  examination: string;
  exam_date: string;
};

// ─── CSV helpers ─────────────────────────────────────────────────────────────

function studentsToCSV(students: Student[]): string {
  const headers = [
    "id",
    "name",
    "phone",
    "father_phone",
    "subject",
    "marks",
    "examination",
    "exam_date",
    "standard",
    "board",
    "location",
  ];
  const escape = (v: unknown) => {
    const s = v === undefined || v === null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const rows = students.map((s) =>
    headers.map((h) => escape(s[h as keyof Student])).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        values.push(cur); cur = "";
      } else {
        cur += ch;
      }
    }
    values.push(cur);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
    return obj;
  });
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Dropdown menu component ─────────────────────────────────────────────────

function DropdownMenu({
  trigger,
  items,
}: {
  trigger: React.ReactNode;
  items: { icon: React.ReactNode; label: string; onClick: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((p) => !p)}>{trigger}</div>
      {open && (
        <div className="absolute right-0 z-50 mt-2 min-w-[180px] rounded-xl border border-border bg-popover shadow-lg py-1 animate-in fade-in slide-in-from-top-1">
          {items.map((item) => (
            <button
              key={item.label}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
              onClick={() => { item.onClick(); setOpen(false); }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Pagination component ─────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Build page number windows: always show first, last, current ±1
  const pageNumbers = useMemo(() => {
    const pages = new Set<number>();
    pages.add(1);
    pages.add(totalPages);
    for (let p = Math.max(1, page - 1); p <= Math.min(totalPages, page + 1); p++) {
      pages.add(p);
    }
    const sorted = Array.from(pages).sort((a, b) => a - b);
    // Insert ellipsis markers (-1) where gaps exist
    const result: number[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push(-1);
      result.push(sorted[i]);
    }
    return result;
  }, [page, totalPages]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 pt-4 pb-1">
      {/* Left: count + rows-per-page */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          {total === 0 ? "No results" : `${from}–${to} of ${total}`}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => { onPageSizeChange(Number(v)); onPageChange(1); }}
          >
            <SelectTrigger className="h-8 w-[70px] rounded-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((s) => (
                <SelectItem key={s} value={String(s)}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right: page buttons */}
      <div className="flex items-center gap-1">
        {/* First */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          disabled={page === 1}
          onClick={() => onPageChange(1)}
          title="First page"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>

        {/* Prev */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          title="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        {/* Page numbers */}
        {pageNumbers.map((p, i) =>
          p === -1 ? (
            <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground select-none">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="icon"
              className="h-8 w-8 rounded-full text-xs"
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          )
        )}

        {/* Next */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          title="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        {/* Last */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          disabled={page === totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Last page"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StudentManagementContent() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [standardFilter, setStandardFilter] = useState("all");
  const [boardFilter, setBoardFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState<AssessmentRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    subject: "",
    marks: "",
    examination: "",
    exam_date: "",
  });

  // ── Pagination state ────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Import state
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState<"csv" | "json">("csv");
  const [importPreview, setImportPreview] = useState<Student[]>([]);
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [studentsRes, assessmentsRes]: any[] = await Promise.all([
          studentsUniversalApi.getAll(),
          teacherStudentAssessmentsApi.getLatestAll(),
        ]);

        const latestMap = new Map<number, AssessmentRow>();
        for (const row of assessmentsRes?.data || []) {
          latestMap.set(Number(row.student_id), row);
        }

        const merged: Student[] = (studentsRes?.data || []).map((s: any) => {
          const latest = latestMap.get(Number(s.id));
          return {
            id: Number(s.id),
            name: s.name || "",
            phone: s.phone || "",
            father_phone: s.father_phone || "",
            subject: latest?.subject || "",
            marks: latest?.marks !== undefined ? Number(latest.marks) : undefined,
            examination: latest?.examination || "",
            exam_date: latest?.exam_date || "",
            standard: s.standard || "",
            board: s.board || "",
            location: s.location || "",
          };
        });

        setStudents(merged);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const standards = useMemo(
    () => Array.from(new Set(students.map((s) => s.standard))).filter(Boolean),
    [students]
  );
  const boards = useMemo(
    () => Array.from(new Set(students.map((s) => s.board))).filter(Boolean),
    [students]
  );
  const locations = useMemo(
    () => Array.from(new Set(students.map((s) => s.location))).filter(Boolean),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return students.filter((student) => {
      const matchesQuery =
        query.length === 0 ||
        student.name.toLowerCase().includes(query) ||
        student.phone.toLowerCase().includes(query) ||
        String(student.father_phone || "").toLowerCase().includes(query);
      const matchesStandard = standardFilter === "all" || student.standard === standardFilter;
      const matchesBoard = boardFilter === "all" || student.board === boardFilter;
      const matchesLocation = locationFilter === "all" || student.location === locationFilter;
      return matchesQuery && matchesStandard && matchesBoard && matchesLocation;
    });
  }, [students, searchTerm, standardFilter, boardFilter, locationFilter]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, standardFilter, boardFilter, locationFilter]);

  // Slice for current page
  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, page, pageSize]);

  // ── Export ────────────────────────────────────────────────────────────────

  const exportCSV = () => {
    const csv = studentsToCSV(filteredStudents);
    downloadBlob(csv, "students.csv", "text/csv;charset=utf-8;");
  };

  const exportJSON = () => {
    const json = JSON.stringify(filteredStudents, null, 2);
    downloadBlob(json, "students.json", "application/json");
  };

  // ── Import ────────────────────────────────────────────────────────────────

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportError("");
    setImportPreview([]);

    const ext = file.name.split(".").pop()?.toLowerCase();
    const fmt: "csv" | "json" = ext === "json" ? "json" : "csv";
    setImportFormat(fmt);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        let parsed: Student[] = [];

        if (fmt === "json") {
          const raw = JSON.parse(text);
          parsed = (Array.isArray(raw) ? raw : [raw]).map((r: any, idx) => ({
            id: Number(r.id) || idx + 1,
            name: r.name || "",
            phone: r.phone || "",
            father_phone: r.father_phone || "",
            subject: r.subject || "",
            marks: r.marks !== undefined ? Number(r.marks) : undefined,
            examination: r.examination || "",
            exam_date: r.exam_date || "",
            standard: r.standard || "",
            board: r.board || "",
            location: r.location || "",
          }));
        } else {
          const rows = parseCSV(text);
          parsed = rows.map((r, idx) => ({
            id: Number(r.id) || idx + 1,
            name: r.name || "",
            phone: r.phone || "",
            father_phone: r.father_phone || "",
            subject: r.subject || "",
            marks: r.marks !== "" && r.marks !== undefined ? Number(r.marks) : undefined,
            examination: r.examination || "",
            exam_date: r.exam_date || "",
            standard: r.standard || "",
            board: r.board || "",
            location: r.location || "",
          }));
        }

        if (parsed.length === 0) throw new Error("No valid rows found in file.");
        setImportPreview(parsed);
      } catch (err: any) {
        setImportError(err.message || "Failed to parse file.");
        setImportPreview([]);
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (importPreview.length === 0) return;
    setImporting(true);
    try {
      setStudents((prev) => {
        const map = new Map(prev.map((s) => [s.id, s]));
        for (const s of importPreview) {
          map.set(s.id, s);
        }
        return Array.from(map.values());
      });
      setImportOpen(false);
      setImportFile(null);
      setImportPreview([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setImportError(err.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  // ── View / Edit / Delete ─────────────────────────────────────────────────

  const openView = async (student: Student) => {
    setSelectedStudent(student);
    setViewOpen(true);
    setHistoryLoading(true);
    try {
      const res: any = await teacherStudentAssessmentsApi.getByStudent(student.id);
      setHistoryRows(res?.data || []);
    } catch (err) {
      console.error(err);
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openEdit = async (student: Student) => {
    setSelectedStudent(student);
    setEditForm({
      subject: "",
      marks: "",
      examination: "",
      exam_date: new Date().toISOString().split("T")[0],
    });
    setHistoryLoading(true);
    try {
      const res: any = await teacherStudentAssessmentsApi.getByStudent(student.id);
      setHistoryRows(res?.data || []);
    } catch (err) {
      console.error(err);
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selectedStudent) return;
    if (!editForm.subject || !editForm.examination || !editForm.exam_date || !editForm.marks) {
      alert("Please fill subject, marks, examination and date");
      return;
    }
    const marksNum = Number(editForm.marks);
    if (Number.isNaN(marksNum) || marksNum < 0) {
      alert("Marks must be a valid non-negative number");
      return;
    }

    setSavingEdit(true);
    try {
      await teacherStudentAssessmentsApi.createByStudent(selectedStudent.id, {
        subject: editForm.subject,
        marks: marksNum,
        examination: editForm.examination,
        exam_date: editForm.exam_date,
      });

      const refreshed: any = await teacherStudentAssessmentsApi.getByStudent(selectedStudent.id);
      const nextHistory = refreshed?.data || [];
      setHistoryRows(nextHistory);

      const latest = nextHistory[0];
      setStudents((prev) =>
        prev.map((s) =>
          s.id === selectedStudent.id
            ? {
                ...s,
                subject: latest?.subject || "",
                marks: latest?.marks !== undefined ? Number(latest.marks) : undefined,
                examination: latest?.examination || "",
                exam_date: latest?.exam_date || "",
              }
            : s
        )
      );
      setEditForm({ subject: "", marks: "", examination: "", exam_date: new Date().toISOString().split("T")[0] });
      setEditOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteStudent = async (student: Student) => {
    if (!confirm(`Delete student "${student.name}"?`)) return;
    setActionLoadingId(student.id);
    try {
      await studentsApi.remove(student.id);
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    } catch (err: any) {
      alert(err.message || "Failed to delete student");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openPerformanceAnalysis = (student: Student) => {
    router.push(`/teacherdashboard/performanceanalysis?studentId=${student.id}`);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section className="rounded-3xl border border-border bg-card p-4 md:p-6 shadow-[var(--shadow-soft)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h2>Students Management</h2>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu
            trigger={
              <Button variant="outline" className="h-9 rounded-full gap-1.5 text-sm">
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            }
            items={[
              {
                icon: <FileText className="h-4 w-4 text-emerald-600" />,
                label: "Export as CSV",
                onClick: exportCSV,
              },
              {
                icon: <FileJson className="h-4 w-4 text-blue-600" />,
                label: "Export as JSON",
                onClick: exportJSON,
              },
            ]}
          />

          <Button
            className="h-9 rounded-full gap-1.5 text-sm"
            onClick={() => {
              setImportOpen(true);
              setImportFile(null);
              setImportPreview([]);
              setImportError("");
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="relative md:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or phone..."
            className="h-10 rounded-full pl-10"
          />
        </div>

        <Select value={standardFilter} onValueChange={setStandardFilter}>
          <SelectTrigger className="h-10 rounded-full">
            <SelectValue placeholder="All Standards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Standards</SelectItem>
            {standards.map((s) => (
              <SelectItem key={s} value={s}>Std {s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={boardFilter} onValueChange={setBoardFilter}>
          <SelectTrigger className="h-10 rounded-full">
            <SelectValue placeholder="All Boards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Boards</SelectItem>
            {boards.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="h-10 rounded-full">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-border">
        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-900 hover:bg-slate-900">
                <TableHead className="text-white">Name</TableHead>
                <TableHead className="text-white">Phone</TableHead>
                <TableHead className="text-white">Marks</TableHead>
                <TableHead className="text-white">Std</TableHead>
                <TableHead className="text-white">Board</TableHead>
                <TableHead className="text-white">Location</TableHead>
                <TableHead className="text-right text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No students found for selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.phone}</TableCell>
                    <TableCell>
                      {student.marks !== undefined ? (
                        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                          {student.marks}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{student.standard}</TableCell>
                    <TableCell>{student.board}</TableCell>
                    <TableCell>{student.location}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button type="button" size="icon" className="h-9 w-9 rounded-full bg-cyan-500 text-white hover:bg-cyan-600" title="View" onClick={() => openView(student)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="icon" className="h-9 w-9 rounded-full bg-teal-500 text-white hover:bg-teal-600" title="Edit" onClick={() => openEdit(student)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="icon" className="h-9 w-9 rounded-full bg-violet-500 text-white hover:bg-violet-600" title="Analyze" onClick={() => openPerformanceAnalysis(student)}>
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="icon" className="h-9 w-9 rounded-full bg-red-500 text-white hover:bg-red-600" title="Delete" onClick={() => deleteStudent(student)} disabled={actionLoadingId === student.id}>
                          {actionLoadingId === student.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredStudents.length > 0 && (
        <Pagination
          total={filteredStudents.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* ── View Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Name:</span> {selectedStudent.name}</div>
                <div><span className="text-muted-foreground">Phone:</span> {selectedStudent.phone}</div>
                <div><span className="text-muted-foreground">Standard:</span> {selectedStudent.standard}</div>
                <div><span className="text-muted-foreground">Board:</span> {selectedStudent.board}</div>
                <div><span className="text-muted-foreground">Location:</span> {selectedStudent.location}</div>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Examination</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-6"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
                    ) : historyRows.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No assessment entries yet.</TableCell></TableRow>
                    ) : (
                      historyRows.map((row) => (
                        <TableRow key={`${row.id || 0}-${row.exam_date}-${row.subject}`}>
                          <TableCell>{row.subject}</TableCell>
                          <TableCell>{row.examination}</TableCell>
                          <TableCell>{row.marks}</TableCell>
                          <TableCell>{row.exam_date ? String(row.exam_date).split("T")[0] : "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Student Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Subject</Label>
              <Input value={editForm.subject} onChange={(e) => setEditForm((p) => ({ ...p, subject: e.target.value }))} placeholder="e.g. Mathematics" />
            </div>
            <div className="space-y-1">
              <Label>Marks</Label>
              <Input type="number" value={editForm.marks} onChange={(e) => setEditForm((p) => ({ ...p, marks: e.target.value }))} placeholder="e.g. 87" />
            </div>
            <div className="space-y-1">
              <Label>Examination</Label>
              <Input value={editForm.examination} onChange={(e) => setEditForm((p) => ({ ...p, examination: e.target.value }))} placeholder="e.g. Unit Test 1" />
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={editForm.exam_date} onChange={(e) => setEditForm((p) => ({ ...p, exam_date: e.target.value }))} />
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-4"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
                  ) : historyRows.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">No tests added yet.</TableCell></TableRow>
                  ) : (
                    historyRows.map((row) => (
                      <TableRow key={`edit-${row.id || 0}-${row.exam_date}-${row.subject}`}>
                        <TableCell>{row.subject}</TableCell>
                        <TableCell>{row.examination}</TableCell>
                        <TableCell>{row.marks}</TableCell>
                        <TableCell>{row.exam_date ? String(row.exam_date).split("T")[0] : "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={savingEdit}>
              {savingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Import Dialog ────────────────────────────────────────────────── */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Students
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Supported formats: CSV &amp; JSON</p>
              <p>CSV columns: <code className="text-xs bg-background rounded px-1">id, name, phone, father_phone, subject, marks, examination, exam_date, standard, board, location</code></p>
              <p>JSON: array of objects with the same keys.</p>
            </div>

            <div
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-8 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex gap-3">
                <FileText className="h-8 w-8 text-emerald-500" />
                <FileJson className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-sm font-medium">Click to choose a CSV or JSON file</p>
              {importFile && (
                <p className="text-xs text-muted-foreground">{importFile.name}</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={handleImportFileChange}
              />
            </div>

            {importError && (
              <p className="text-sm text-red-500 rounded-lg bg-red-50 px-3 py-2">{importError}</p>
            )}

            {importPreview.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Preview — {importPreview.length} student{importPreview.length !== 1 ? "s" : ""} found
                </p>
                <div className="rounded-xl border border-border overflow-auto max-h-52">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Std</TableHead>
                        <TableHead>Board</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Marks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.slice(0, 10).map((s, i) => (
                        <TableRow key={i}>
                          <TableCell>{s.name || "—"}</TableCell>
                          <TableCell>{s.phone || "—"}</TableCell>
                          <TableCell>{s.standard || "—"}</TableCell>
                          <TableCell>{s.board || "—"}</TableCell>
                          <TableCell>{s.location || "—"}</TableCell>
                          <TableCell>{s.marks !== undefined ? s.marks : "—"}</TableCell>
                        </TableRow>
                      ))}
                      {importPreview.length > 10 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-2">
                            …and {importPreview.length - 10} more
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button
              onClick={confirmImport}
              disabled={importPreview.length === 0 || importing}
            >
              {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Import {importPreview.length > 0 ? `${importPreview.length} Students` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}