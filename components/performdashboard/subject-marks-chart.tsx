"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface Subject {
  name: string;
  marks: number;
  total: number;
  color: string;
}

interface SubjectMarksChartProps {
  subjects: Subject[];
  average: number;
}

export function SubjectMarksChart({ subjects, average }: SubjectMarksChartProps) {
  const totalObtained = subjects.reduce((sum, s) => sum + s.marks, 0);
  const totalMax = subjects.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
      <h3 className="mb-4 text-lg font-semibold text-slate-800">
        Subject-wise Marks
      </h3>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        <div className="relative w-52 h-52 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <Pie
                data={subjects}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="marks"
                startAngle={90}
                endAngle={-270}
              >
                {subjects.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-slate-400">Average</span>
            <span className="text-2xl font-bold text-slate-800">{average}%</span>
            <span className="text-xs font-medium text-slate-500 mt-0.5">
              {totalObtained}/{totalMax}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {subjects.map((subject) => {
            const pct = subject.total > 0 ? Math.round((subject.marks / subject.total) * 100) : 0;
            return (
              <div key={subject.name} className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: subject.color }}
                />
                <span className="text-sm text-slate-600 w-24">{subject.name}</span>
                <span className="text-sm font-semibold text-slate-800 w-16">
                  {subject.marks}/{subject.total}
                </span>
                <span className="text-xs text-slate-400">{pct}%</span>
              </div>
            );
          })}

          {/* Total row */}
          {subjects.length > 0 && (
            <>
              <div className="my-0.5 border-t border-slate-100" />
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-700 w-24">Total</span>
                <span className="text-sm font-bold text-slate-900 w-16">
                  {totalObtained}/{totalMax}
                </span>
                <span className="text-xs font-semibold text-slate-500">{average}%</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}