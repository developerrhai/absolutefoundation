"use client";

import { getGrade, getPerformanceLabel } from "@/lib/student-data";
import { cn } from "@/lib/utils";

interface Subject {
  name: string;
  marks: number;
  total: number;
}

interface DetailedAnalysisProps {
  subjects: Subject[];
}

export function DetailedAnalysis({ subjects }: DetailedAnalysisProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
      <h3 className="mb-4 text-lg font-semibold text-slate-800">
        Subject-wise Detailed Analysis
      </h3>
      {subjects.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">
          No subject marks yet. Add marks to see detailed analysis.
        </p>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-700 text-white">
              <th className="px-4 py-3 text-left text-sm font-semibold rounded-l-lg">
                Subject
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold">
                Marks Obtained
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold">
                Total Marks
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold">
                Percentage
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold">
                Grade
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold rounded-r-lg">
                Performance
              </th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject, index) => {
              const percentage = Math.round((subject.marks / subject.total) * 100);
              const grade = getGrade(percentage);
              const performance = getPerformanceLabel(percentage);
              
              return (
                <tr
                  key={subject.name}
                  className={cn(
                    "border-b border-slate-100 transition-colors hover:bg-slate-50",
                    index === subjects.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-4 py-3.5 text-sm font-medium text-slate-700">
                    {subject.name}
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm text-slate-600">
                    {subject.marks}
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm text-slate-600">
                    {subject.total}
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm text-slate-600">
                    {percentage}%
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm font-semibold text-slate-700">
                    {grade}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={cn(
                        "inline-block rounded-full px-3 py-1 text-xs font-semibold",
                        performance.color
                      )}
                    >
                      {performance.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
