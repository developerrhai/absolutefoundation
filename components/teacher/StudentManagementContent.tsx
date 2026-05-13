"use client";

import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Search, Eye, Pencil, Trash2, Loader2, BarChart3 } from "lucide-react";
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

  // useEffect(() => {
  //   const load = async () => {
  //     setLoading(true);
  //     try {
  //       const [studentsRes, assessmentsRes]: any[] = await Promise.all([
  //         studentsUniversalApi.getAll(),
  //         teacherStudentAssessmentsApi.getLatestAll(),
  //       ]);

  //       const latestMap = new Map<number, AssessmentRow>();
  //       for (const row of assessmentsRes?.data || []) {
  //         latestMap.set(Number(row.student_id), row);
  //       }

  //       const merged: Student[] = (studentsRes?.data || []).map((s: any) => {
  //         const latest = latestMap.get(Number(s.id));
  //         return {
  //           id: Number(s.id),
  //           name: s.name || "",
  //           phone: s.phone || "",
  //           father_phone: s.father_phone || "",
  //           subject: latest?.subject || "",
  //           marks: latest?.marks !== undefined ? Number(latest.marks) : undefined,
  //           examination: latest?.examination || "",
  //           exam_date: latest?.exam_date || "",
  //           standard: s.standard || "",
  //           board: s.board || "",
  //           location: s.location || "",
  //         };
  //       });

  //       setStudents(merged);
  //     } catch (err) {
  //       console.error(err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   load();
  // }, []);

  useEffect(() => {
  const load = async () => {
    setLoading(true);

    // ✅ STATIC STUDENTS
    const mockStudents: Student[] = [
      {
        id: 1,
        name: "Rahul Sharma",
        phone: "9876543210",
        father_phone: "9123456780",
        subject: "Math",
        marks: 85,
        examination: "Unit Test 1",
        exam_date: "2026-05-01",
        standard: "10",
        board: "CBSE",
        location: "Aurangabad",
      },
      {
        id: 2,
        name: "Priya Patil",
        phone: "9988776655",
        father_phone: "9112233445",
        subject: "Science",
        marks: 92,
        examination: "Unit Test 1",
        exam_date: "2026-05-02",
        standard: "9",
        board: "State Board",
        location: "Pune",
      },
      {
        id: 3,
        name: "Amit Kumar",
        phone: "9090909090",
        father_phone: "9000000000",
        subject: "English",
        marks: 76,
        examination: "Mid Term",
        exam_date: "2026-05-03",
        standard: "8",
        board: "CBSE",
        location: "Mumbai",
      },
    ];

    setStudents(mockStudents);
    setLoading(false);
  };

  load();
}, []);


  const standards = useMemo(
    () => Array.from(new Set(students.map((student) => student.standard))).filter(Boolean),
    [students]
  );
  const boards = useMemo(
    () => Array.from(new Set(students.map((student) => student.board))).filter(Boolean),
    [students]
  );
  const locations = useMemo(
    () => Array.from(new Set(students.map((student) => student.location))).filter(Boolean),
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
      const matchesStandard =
        standardFilter === "all" || student.standard === standardFilter;
      const matchesBoard = boardFilter === "all" || student.board === boardFilter;
      const matchesLocation =
        locationFilter === "all" || student.location === locationFilter;

      return (
        matchesQuery && matchesStandard && matchesBoard && matchesLocation
      );
    });
  }, [students, searchTerm, standardFilter, boardFilter, locationFilter]);

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
      setEditForm({
        subject: "",
        marks: "",
        examination: "",
        exam_date: new Date().toISOString().split("T")[0],
      });
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

  return (
    <section className="rounded-3xl border border-border bg-card p-4 md:p-6 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 text-xl font-semibold">
        <GraduationCap className="h-5 w-5 text-primary" />
        <h2>Students Management</h2>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="relative md:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
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
            {standards.map((standard) => (
              <SelectItem key={standard} value={standard}>
                Std {standard}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={boardFilter} onValueChange={setBoardFilter}>
          <SelectTrigger className="h-10 rounded-full">
            <SelectValue placeholder="All Boards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Boards</SelectItem>
            {boards.map((board) => (
              <SelectItem key={board} value={board}>
                {board}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="h-10 rounded-full">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
                {/* <TableHead className="text-white">Subject</TableHead> */}
                <TableHead className="text-white">Marks</TableHead>
                <TableHead className="text-white">Std</TableHead>
                <TableHead className="text-white">Board</TableHead>
                <TableHead className="text-white">Location</TableHead>
                <TableHead className="text-right text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No students found for selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.phone}</TableCell>
                    {/* <TableCell>{student.subject || "—"}</TableCell> */}
                    <TableCell>
                      {student.marks !== undefined ? (
                        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                          {student.marks}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{student.standard}</TableCell>
                    <TableCell>{student.board}</TableCell>
                    <TableCell>{student.location}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="icon"
                          className="h-9 w-9 rounded-full bg-cyan-500 text-white hover:bg-cyan-600"
                          title="View"
                          onClick={() => openView(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          className="h-9 w-9 rounded-full bg-teal-500 text-white hover:bg-teal-600"
                          title="Edit"
                          onClick={() => openEdit(student)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          className="h-9 w-9 rounded-full bg-violet-500 text-white hover:bg-violet-600"
                          title="Analyze"
                          onClick={() => openPerformanceAnalysis(student)}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          className="h-9 w-9 rounded-full bg-red-500 text-white hover:bg-red-600"
                          title="Delete"
                          onClick={() => deleteStudent(student)}
                          disabled={actionLoadingId === student.id}
                        >
                          {actionLoadingId === student.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6">
                          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : historyRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                          No assessment entries yet.
                        </TableCell>
                      </TableRow>
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Student Test</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Subject</Label>
              <Input
                value={editForm.subject}
                onChange={(e) => setEditForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder="e.g. Mathematics"
              />
            </div>
            <div className="space-y-1">
              <Label>Marks</Label>
              <Input
                type="number"
                value={editForm.marks}
                onChange={(e) => setEditForm((p) => ({ ...p, marks: e.target.value }))}
                placeholder="e.g. 87"
              />
            </div>
            <div className="space-y-1">
              <Label>Examination</Label>
              <Input
                value={editForm.examination}
                onChange={(e) => setEditForm((p) => ({ ...p, examination: e.target.value }))}
                placeholder="e.g. Unit Test 1"
              />
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input
                type="date"
                value={editForm.exam_date}
                onChange={(e) => setEditForm((p) => ({ ...p, exam_date: e.target.value }))}
              />
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
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : historyRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                        No tests added yet.
                      </TableCell>
                    </TableRow>
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
    </section>
  );
}
