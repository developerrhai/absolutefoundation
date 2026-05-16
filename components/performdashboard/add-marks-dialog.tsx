"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
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

type AddMarksDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number | null;
  studentName?: string;
  onSaved: () => void;
};

const emptyForm = () => ({
  subject: "",
  marks: "",
  total_marks: "100",
  examination: "",
  exam_date: new Date().toISOString().split("T")[0],
});

export function AddMarksDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  onSaved,
}: AddMarksDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetAndClose = () => {
    setForm(emptyForm());
    setError(null);
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!studentId) return;
    if (!form.subject.trim() || !form.examination.trim() || !form.exam_date || !form.marks.trim()) {
      setError("Subject, marks, examination, and date are required.");
      return;
    }

    const marksNum = Number(form.marks);
    if (Number.isNaN(marksNum) || marksNum < 0) {
      setError("Marks must be a valid non-negative number.");
      return;
    }

    const totalNum =
      form.total_marks.trim() !== "" ? Number(form.total_marks) : 100;
    if (Number.isNaN(totalNum) || totalNum <= 0) {
      setError("Total marks must be greater than zero.");
      return;
    }
    if (marksNum > totalNum) {
      setError("Marks obtained cannot exceed total marks.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await teacherStudentAssessmentsApi.createByStudent(studentId, {
        subject: form.subject.trim(),
        marks: marksNum,
        total_marks: totalNum,
        examination: form.examination.trim(),
        exam_date: form.exam_date,
      });
      setForm(emptyForm());
      onSaved();
      onOpenChange(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetAndClose();
        else onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-teal-600" />
            Add Marks{studentName ? ` — ${studentName}` : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="perf-subject">Subject</Label>
            <Input
              id="perf-subject"
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              placeholder="e.g. Mathematics"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="perf-marks">Marks obtained</Label>
              <Input
                id="perf-marks"
                type="number"
                min={0}
                value={form.marks}
                onChange={(e) => setForm((p) => ({ ...p, marks: e.target.value }))}
                placeholder="87"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="perf-total">Total marks</Label>
              <Input
                id="perf-total"
                type="number"
                min={1}
                value={form.total_marks}
                onChange={(e) => setForm((p) => ({ ...p, total_marks: e.target.value }))}
                placeholder="100"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="perf-exam">Examination</Label>
            <Input
              id="perf-exam"
              value={form.examination}
              onChange={(e) => setForm((p) => ({ ...p, examination: e.target.value }))}
              placeholder="e.g. Unit Test 1"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="perf-date">Date</Label>
            <Input
              id="perf-date"
              type="date"
              value={form.exam_date}
              onChange={(e) => setForm((p) => ({ ...p, exam_date: e.target.value }))}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !studentId}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save marks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
