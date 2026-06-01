"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Settings, Sparkles, GraduationCap, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { clearToken } from "@/lib/api";

const items = [
  { title: "Dashboard", url: "/teacherdashboard", icon: Home },
  { title: "Teacher", url: "/teacherdashboard/notes", icon: GraduationCap },
  // { title: "Subjects", url: "/teacherdashboard/subjects", icon: BookOpen },
  { title: "Student Management", url: "/teacherdashboard/subjects", icon: BookOpen },
  { title: "Settings", url: "/teacherdashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
    const handleLogout = () => {
    clearToken();
    localStorage.removeItem("userInfo");
    window.location.href = "/";
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-6 py-6 flex items-center gap-2">
        <div
          className="h-9 w-9 rounded-xl grid place-items-center"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-semibold tracking-tight">Absolute Foundation</div>
          <div className="text-xs text-sidebar-foreground/60">Study smarter</div>
        </div>
      </div>

      <nav className="px-3 py-2 flex-1 space-y-1">
        {items.map((item) => {
          const active = pathname === item.url;
          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[var(--shadow-elegant)]"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-2xl p-4 bg-sidebar-accent/60 border border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/70">Pro tip</div>
        <div className="mt-1 text-sm font-medium leading-snug">
          Organize notes by chapter to revise 3× faster.
        </div>
      </div>
       <div className="px-3 pb-3">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium border border-red-300 bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
