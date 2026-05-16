"use client";

import { useState } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
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
import { studentAttendanceApi } from "../../lib/api";

type AddAttendanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number | null;
  studentName?: string;
  onSaved: () => void;
};

const emptyForm = () => ({
  period_label: "",
  attendance_percentage: "",
  record_date: new Date().toISOString().split("T")[0],
  notes: "",
});

export function AddAttendanceDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  onSaved,
}: AddAttendanceDialogProps) {
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
    if (!form.period_label.trim() || !form.record_date || !form.attendance_percentage.trim()) {
      setError("Period, attendance %, and date are required.");
      return;
    }

    const pct = Number(form.attendance_percentage);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      setError("Attendance must be between 0 and 100.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await studentAttendanceApi.createByStudent(studentId, {
        period_label: form.period_label.trim(),
        attendance_percentage: pct,
        record_date: form.record_date,
        notes: form.notes.trim() || undefined,
      });
      setForm(emptyForm());
      onSaved();
      onOpenChange(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save attendance");
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
            <CalendarCheck className="h-5 w-5 text-emerald-600" />
            Add Attendance{studentName ? ` — ${studentName}` : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="att-period">Period / term</Label>
            <Input
              id="att-period"
              value={form.period_label}
              onChange={(e) => setForm((p) => ({ ...p, period_label: e.target.value }))}
              placeholder="e.g. Term 1 2025"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="att-pct">Attendance %</Label>
            <Input
              id="att-pct"
              type="number"
              min={0}
              max={100}
              value={form.attendance_percentage}
              onChange={(e) =>
                setForm((p) => ({ ...p, attendance_percentage: e.target.value }))
              }
              placeholder="92"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="att-date">Record date</Label>
            <Input
              id="att-date"
              type="date"
              value={form.record_date}
              onChange={(e) => setForm((p) => ({ ...p, record_date: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="att-notes">Notes (optional)</Label>
            <Input
              id="att-notes"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="e.g. Monthly average"
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save attendance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
