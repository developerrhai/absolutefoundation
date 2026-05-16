"use client";

import { useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { teacherStudentAssessmentsApi } from "../../lib/api";

type StudentOption = { id: number; name: string };

type BulkAddMarksDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentOption[];
  onSaved: () => void;
};

export function BulkAddMarksDialog({
  open,
  onOpenChange,
  students,
  onSaved,
}: BulkAddMarksDialogProps) {
  const [common, setCommon] = useState({
    subject: "",
    examination: "",
    exam_date: new Date().toISOString().split("T")[0],
    total_marks: "100",
  });
  const [marksByStudent, setMarksByStudent] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setCommon({
      subject: "",
      examination: "",
      exam_date: new Date().toISOString().split("T")[0],
      total_marks: "100",
    });
    setMarksByStudent({});
    setError(null);
    setProgress({ done: 0, total: 0 });
  };

  const handleSave = async () => {
    if (!common.subject.trim() || !common.examination.trim() || !common.exam_date) {
      setError("Subject, examination, and date are required.");
      return;
    }

    const entries = Object.entries(marksByStudent).filter(([, v]) => v.trim() !== "");
    if (entries.length === 0) {
      setError("Enter marks for at least one student.");
      return;
    }

    const totalNum =
      common.total_marks.trim() !== "" ? Number(common.total_marks) : 100;
    if (Number.isNaN(totalNum) || totalNum <= 0) {
      setError("Total marks must be greater than zero.");
      return;
    }

    for (const [, v] of entries) {
      const m = Number(v);
      if (Number.isNaN(m) || m < 0) {
        setError("All marks must be valid non-negative numbers.");
        return;
      }
      if (m > totalNum) {
        setError("Some marks exceed the total. Please fix before saving.");
        return;
      }
    }

    setSaving(true);
    setError(null);
    setProgress({ done: 0, total: entries.length });

    for (let i = 0; i < entries.length; i++) {
      const [idStr, marksStr] = entries[i];
      try {
        await teacherStudentAssessmentsApi.createByStudent(Number(idStr), {
          subject: common.subject.trim(),
          marks: Number(marksStr),
          total_marks: totalNum,
          examination: common.examination.trim(),
          exam_date: common.exam_date,
        });
      } catch (err) {
        console.error(`Bulk marks failed for student ${idStr}:`, err);
      }
      setProgress({ done: i + 1, total: entries.length });
    }

    setSaving(false);
    reset();
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-amber-500" />
            Bulk Add Marks
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <Label>Subject</Label>
            <Input
              value={common.subject}
              onChange={(e) => setCommon((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Mathematics"
            />
          </div>
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <Label>Examination</Label>
            <Input
              value={common.examination}
              onChange={(e) => setCommon((p) => ({ ...p, examination: e.target.value }))}
              placeholder="Unit Test 1"
            />
          </div>
          <div className="space-y-1">
            <Label>Date</Label>
            <Input
              type="date"
              value={common.exam_date}
              onChange={(e) => setCommon((p) => ({ ...p, exam_date: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Total marks</Label>
            <Input
              type="number"
              min={1}
              value={common.total_marks}
              onChange={(e) => setCommon((p) => ({ ...p, total_marks: e.target.value }))}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 rounded-lg bg-red-50 border border-red-100 px-3 py-2 shrink-0">
            {error}
          </p>
        )}

        {saving && (
          <p className="text-sm text-teal-700 shrink-0">
            Saving {progress.done} / {progress.total}...
          </p>
        )}

        <div className="overflow-y-auto flex-1 border border-slate-200 rounded-lg mt-2">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-slate-600">Student</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600 w-28">Marks</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="px-3 py-2 font-medium text-slate-700">{s.name}</td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      className="h-8"
                      placeholder="—"
                      value={marksByStudent[s.id] ?? ""}
                      onChange={(e) =>
                        setMarksByStudent((prev) => ({
                          ...prev,
                          [s.id]: e.target.value,
                        }))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter className="shrink-0">
          <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save all marks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
