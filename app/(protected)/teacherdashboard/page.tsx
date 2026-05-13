import Link from "next/link";
import { DashboardShell } from "@/components/teacher/DashboardShell";
import { ArrowRight, BookOpen, CalendarDays, GraduationCap, NotebookPen, Sparkles, TrendingUp } from "lucide-react";

const stats = [
  { label: "Total notes", value: "128", icon: NotebookPen, trend: "+18%" },
  { label: "Subjects", value: "6", icon: BookOpen, trend: "+2" },
  { label: "Streak", value: "12 days", icon: TrendingUp, trend: "+4 days" },
];

const teachersAttended = [
  { name: "Mr. Sharma", subject: "Physics", chapter: "Laws of Motion", sessions: 12, initial: "S" },
  { name: "Ms. Verma", subject: "Biology", chapter: "Cell : The Unit of Life", sessions: 9, initial: "V" },
  { name: "Dr. Iyer", subject: "Chemistry", chapter: "Chemical Bonding", sessions: 7, initial: "I" },
  { name: "Mr. Khanna", subject: "Physics", chapter: "Thermodynamics", sessions: 5, initial: "K" },
];

export default function HomePage() {
  return (
    <DashboardShell title="Dashboard">
      
      {/* HERO SECTION */}
      <section
        className="rounded-2xl p-10 md:p-14 text-primary-foreground relative overflow-hidden shadow-[var(--shadow-elegant)] border border-white/20"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.24),transparent_45%)]" />
        
        <div className="max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-medium bg-white/15 backdrop-blur px-4 py-1.5 rounded-full border border-white/20">
            <Sparkles className="h-4 w-4" /> Welcome back, Vaibhav
          </div>

          <h2 className="text-4xl mt-2 md:text-5xl font-bold leading-tight">
            Track teacher attendance <br /> in a smarter way.
          </h2>

          <p className="text-primary-foreground/85 mb-3 text-lg">
            Pick a standard, exam, subject and chapter — then mark which teachers attended each session.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="teacherdashboard/notes"
              className="inline-flex items-center gap-2 bg-background text-foreground px-6 py-3 rounded-full font-medium hover:bg-card transition-all shadow-md hover:scale-[1.03]"
            >
              Open Teacher Attendance <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm">
              <CalendarDays className="h-4 w-4" />
              4 classes scheduled today
            </div>
          </div>
        </div>

        <div className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      </section>

      {/* STATS */}
      {/* <div className="grid sm:grid-cols-3 gap-6 mt-10">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-card border border-border/70 p-6 shadow-[var(--shadow-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <s.icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 text-3xl font-bold">{s.value}</div>

            <div className="mt-2 text-xs text-emerald-600 font-medium">
              {s.trend} this month
            </div>
          </div>
        ))}
      </div> */}

      {/* TEACHERS LIST */}
      {/* <div className="mt-10 rounded-2xl bg-card border border-border/70 p-7 shadow-[var(--shadow-soft)]">
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Teachers attended
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your recent classes and educators.
            </p>
          </div>

          <span className="text-xs px-3 py-1 rounded-full bg-accent/70 text-accent-foreground font-medium border border-border/70">
            {teachersAttended.length} this month
          </span>
        </div>

        <ul className="space-y-4 mt-6">
          {teachersAttended.map((t) => (
            <li
              key={t.name}
              className="flex items-center gap-4 rounded-xl border border-border/60 px-5 py-4 hover:border-primary/30 hover:bg-muted/40 transition-all"
            >
              <div
                className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-semibold text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
              >
                {t.initial}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-base truncate">{t.name}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {t.subject} • {t.chapter}
                </div>
              </div>

              <div className="text-right bg-muted/60 px-4 py-2 rounded-lg">
                <div className="text-sm font-semibold">{t.sessions}</div>
                <div className="text-[11px] text-muted-foreground">sessions</div>
              </div>
            </li>
          ))}
        </ul>
      </div> */}

      {/* BOTTOM CARDS */}
      <div className="mt-10 grid md:grid-cols-2 gap-6">
        
        <div className="rounded-2xl bg-card border border-border/70 p-6 shadow-[var(--shadow-soft)] hover:shadow-md transition">
          <h3 className="text-lg font-semibold">Quick start</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Jump into the 5-step wizard to organize a new chapter.
          </p>

          <Link
            href="/teacherdashboard/notes"
            className="mt-5 inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            Go to Attendance <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-6">
          <h3 className="text-lg font-semibold">Today&apos;s focus</h3>

          <p className="text-sm text-muted-foreground mt-2">
            Complete attendance entries for Physics and revise Biology notes.
          </p>

          <div className="mt-5 h-2 rounded-full bg-primary/15 overflow-hidden">
            <div className="h-full w-2/3 bg-primary rounded-full transition-all duration-500" />
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            67% of your daily goal completed
          </p>
        </div>

      </div>
    </DashboardShell>
  );
}