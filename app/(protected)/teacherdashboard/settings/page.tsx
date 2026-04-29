import { DashboardShell } from "@/components/teacher/DashboardShell";

export default function SettingsPage() {
  return (
    <DashboardShell title="Settings">
      <div className="rounded-2xl bg-card border border-border p-6">
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Configure preferences and account options here.
        </p>
      </div>
    </DashboardShell>
  );
}
