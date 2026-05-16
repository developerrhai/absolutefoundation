"use client";

import { Loader2 } from "lucide-react";

export type RankHistoryRow = {
  id?: number;
  class_rank: number;
  total_students: number;
  average_percentage: number;
  snapshot_date: string;
};

type RankHistoryProps = {
  rows: RankHistoryRow[];
  loading?: boolean;
};

export function RankHistory({ rows, loading }: RankHistoryProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
      <h3 className="mb-4 text-lg font-semibold text-slate-800">Rank History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-700 text-white">
              <th className="px-4 py-3 text-left font-semibold rounded-l-lg">Date</th>
              <th className="px-4 py-3 text-center font-semibold">Rank</th>
              <th className="px-4 py-3 text-center font-semibold">Students</th>
              <th className="px-4 py-3 text-center font-semibold rounded-r-lg">Avg %</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  No rank snapshots yet. Ranks are saved when you add marks.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={`${row.id ?? index}-${row.snapshot_date}`}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-slate-700">
                    {row.snapshot_date ? String(row.snapshot_date).split("T")[0] : "—"}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">
                    #{row.class_rank}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    {row.total_students}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    {Number(row.average_percentage).toFixed(1)}%
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
