"use client";

import { Loader2 } from "lucide-react";
import type { AssessmentRow } from "@/lib/performance-utils";

type AssessmentHistoryProps = {
  rows: AssessmentRow[];
  loading?: boolean;
};

export function AssessmentHistory({ rows, loading }: AssessmentHistoryProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
      <h3 className="mb-4 text-lg font-semibold text-slate-800">
        Assessment History
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-700 text-white">
              <th className="px-4 py-3 text-left font-semibold rounded-l-lg">Subject</th>
              <th className="px-4 py-3 text-left font-semibold">Examination</th>
              <th className="px-4 py-3 text-center font-semibold">Marks</th>
              <th className="px-4 py-3 text-center font-semibold">Total</th>
              <th className="px-4 py-3 text-center font-semibold rounded-r-lg">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No assessments recorded yet. Use Add Marks to enter results.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={`${row.id ?? index}-${row.subject}-${row.exam_date}`}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-700">{row.subject}</td>
                  <td className="px-4 py-3 text-slate-600">{row.examination}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{row.marks}</td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    {row.total_marks && row.total_marks > 0 ? row.total_marks : 100}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    {row.exam_date ? String(row.exam_date).split("T")[0] : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
