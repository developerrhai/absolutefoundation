// app/(protected)/teacherdashboard/performanceanalysis/page.tsx

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import StudentPerformanceDashboard from "../../../../components/performdashboard/student-performance-dashboard";

export default function PerformanceAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
        </div>
      }
    >
      <StudentPerformanceDashboard />
    </Suspense>
  );
}