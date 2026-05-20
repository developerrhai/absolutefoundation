"use client";

import { useState, useMemo } from "react";
import { Filter, BookOpen, FlaskConical, CalendarRange, X, ChevronDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PerformanceFiltersValue {
  examination: string;   // "" = all
  subject: string;       // "" = all
  dateFrom: string;      // ISO date string "YYYY-MM-DD" | ""
  dateTo: string;        // ISO date string "YYYY-MM-DD" | ""
}

interface PerformanceFiltersProps {
  /** All assessment rows — used to derive unique examination & subject lists */
  assessmentRows: Array<{
    subject: string;
    examination: string;
    exam_date: string;
  }>;
  value: PerformanceFiltersValue;
  onChange: (next: PerformanceFiltersValue) => void;
}

// ─── Preset date ranges ───────────────────────────────────────────────────────

type Preset = "all" | "this_month" | "last_month" | "last_3" | "last_6" | "custom";

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoMonthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function startOfMonth(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function startOfLastMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

function endOfLastMonth(): string {
  const d = new Date();
  d.setDate(0); // last day of previous month
  return d.toISOString().slice(0, 10);
}

const PRESETS: { label: string; value: Preset }[] = [
  { label: "All Time", value: "all" },
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "Last 3 Months", value: "last_3" },
  { label: "Last 6 Months", value: "last_6" },
  { label: "Custom Range", value: "custom" },
];

function presetToDates(p: Preset): { dateFrom: string; dateTo: string } {
  switch (p) {
    case "all":        return { dateFrom: "", dateTo: "" };
    case "this_month": return { dateFrom: startOfMonth(), dateTo: isoToday() };
    case "last_month": return { dateFrom: startOfLastMonth(), dateTo: endOfLastMonth() };
    case "last_3":     return { dateFrom: isoMonthsAgo(3), dateTo: isoToday() };
    case "last_6":     return { dateFrom: isoMonthsAgo(6), dateTo: isoToday() };
    case "custom":     return { dateFrom: "", dateTo: "" };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean))).sort();
}

function activeFilterCount(v: PerformanceFiltersValue): number {
  let n = 0;
  if (v.examination) n++;
  if (v.subject) n++;
  if (v.dateFrom || v.dateTo) n++;
  return n;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PerformanceFilters({
  assessmentRows,
  value,
  onChange,
}: PerformanceFiltersProps) {
  const [preset, setPreset] = useState<Preset>("all");
  const [showCustom, setShowCustom] = useState(false);

  const examinations = useMemo(
    () => unique(assessmentRows.map((r) => r.examination)),
    [assessmentRows]
  );
  const subjects = useMemo(
    () => unique(assessmentRows.map((r) => r.subject)),
    [assessmentRows]
  );

  const activeCount = activeFilterCount(value);

  function handlePreset(p: Preset) {
    setPreset(p);
    setShowCustom(p === "custom");
    if (p !== "custom") {
      const dates = presetToDates(p);
      onChange({ ...value, ...dates });
    }
  }

  function handleClearAll() {
    setPreset("all");
    setShowCustom(false);
    onChange({ examination: "", subject: "", dateFrom: "", dateTo: "" });
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-teal-600" />
          <span className="text-sm font-semibold text-slate-700">Filter Performance Data</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-teal-600 text-white text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </div>

      {/* ── Filter controls ── */}
      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* 1. Examination selector */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <FlaskConical className="h-3.5 w-3.5 text-violet-500" />
            Examination
          </label>
          <div className="relative">
            <select
              value={value.examination}
              onChange={(e) => onChange({ ...value, examination: e.target.value })}
              className="w-full appearance-none h-9 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
            >
              <option value="">All Examinations</option>
              {examinations.map((ex) => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
          {value.examination && (
            <span className="inline-flex items-center gap-1 self-start text-[11px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-medium">
              {value.examination}
              <button onClick={() => onChange({ ...value, examination: "" })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>

        {/* 2. Subject filter */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <BookOpen className="h-3.5 w-3.5 text-amber-500" />
            Subject
          </label>
          <div className="relative">
            <select
              value={value.subject}
              onChange={(e) => onChange({ ...value, subject: e.target.value })}
              className="w-full appearance-none h-9 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
          {value.subject && (
            <span className="inline-flex items-center gap-1 self-start text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {value.subject}
              <button onClick={() => onChange({ ...value, subject: "" })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>

        {/* 3. Date range */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <CalendarRange className="h-3.5 w-3.5 text-teal-500" />
            Date Range
          </label>
          <div className="relative">
            <select
              value={preset}
              onChange={(e) => handlePreset(e.target.value as Preset)}
              className="w-full appearance-none h-9 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
            >
              {PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
          {(value.dateFrom || value.dateTo) && !showCustom && (
            <span className="inline-flex items-center gap-1 self-start text-[11px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
              {value.dateFrom || "…"} → {value.dateTo || "today"}
              <button onClick={() => { handlePreset("all"); }}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* ── Custom date picker (shown when "Custom Range" is selected) ── */}
      {showCustom && (
        <div className="px-5 pb-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">From</label>
            <input
              type="date"
              value={value.dateFrom}
              max={value.dateTo || isoToday()}
              onChange={(e) => onChange({ ...value, dateFrom: e.target.value })}
              className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">To</label>
            <input
              type="date"
              value={value.dateTo}
              min={value.dateFrom}
              max={isoToday()}
              onChange={(e) => onChange({ ...value, dateTo: e.target.value })}
              className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
          </div>
          {(value.dateFrom || value.dateTo) && (
            <div className="col-span-2">
              <span className="inline-flex items-center gap-1 text-[11px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                {value.dateFrom || "Any start"} → {value.dateTo || "Any end"}
                <button onClick={() => onChange({ ...value, dateFrom: "", dateTo: "" })}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}