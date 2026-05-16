"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getToken } from "@/lib/api";

/**
 * Ensures only logged-in teachers reach the performance dashboard page.
 * Same auth rules as DashboardShell.
 */
export function PerformanceAnalysisGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }

    const storedUser = localStorage.getItem("userInfo");
    let userRole: string | null = null;
    if (storedUser) {
      try {
        userRole = JSON.parse(storedUser)?.role ?? null;
      } catch {
        userRole = null;
      }
    }

    if (userRole === "admin") {
      router.replace("/dashboard");
      return;
    }

    if (userRole !== "teacher") {
      router.replace("/");
    }
  }, [router]);

  if (!getToken()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
      </div>
    );
  }

  return <>{children}</>;
}
