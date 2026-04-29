"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Plus, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

type Note = {
  id: string;
  standard: string;
  exam: string;
  subject: string;
  chapter: string;
  title: string;
  description: string;
  link: string;
};

const STANDARDS = ["11th", "12th"];
const EXAMS = ["NEET", "JEE", "Boards"];
const SUBJECTS = ["Biology", "Chemistry", "Physics"];
const CHAPTERS: Record<string, string[]> = {
  Biology: [
    "Anatomy of Flowering Plants",
    "Biodiversity and conservation",
    "Biological Classification",
    "Cell : The Unit of Life",
    "Cell Cycle and Division",
    "Ecosystem",
    "Environmental Issues",
    "Microbes In Human Welfare",
    "Molecular Basis of Inheritance",
  ],
  Chemistry: [
    "Some Basic Concepts",
    "Structure of Atom",
    "Chemical Bonding",
    "Thermodynamics",
    "Equilibrium",
    "Redox Reactions",
  ],
  Physics: [
    "Units and Measurements",
    "Motion in a Straight Line",
    "Laws of Motion",
    "Work, Energy and Power",
    "Gravitation",
    "Thermodynamics",
  ],
};

const STEP_LABELS = [
  "Select standard",
  "Select exam",
  "Select subject",
  "Select chapter",
  "Notes",
];

export function ManageWizard() {
  const [step, setStep] = useState(1);
  const [standard, setStandard] = useState<string | null>(null);
  const [exam, setExam] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [chapter, setChapter] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [open, setOpen] = useState(false);

  const chapters = useMemo(() => (subject ? CHAPTERS[subject] ?? [] : []), [subject]);

  const goBack = () => {
    if (step === 1) return;
    setStep((s) => s - 1);
  };

  const reset = () => {
    setStep(1);
    setStandard(null);
    setExam(null);
    setSubject(null);
    setChapter(null);
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.standard === standard &&
      n.exam === exam &&
      n.subject === subject &&
      n.chapter === chapter
  );

  return (
    <div className="mx-auto max-w-3xl">
      {/* Step header */}
      <div className="flex items-center gap-3 mb-2">
        {step > 1 && (
          <button
            onClick={goBack}
            className="h-9 w-9 grid place-items-center rounded-full bg-muted hover:bg-accent transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-bold">{STEP_LABELS[step - 1]}</h2>
          <p className="text-sm text-muted-foreground">
            Step {step} of 5
            {step >= 3 && subject ? ` · ${standard} · ${exam} · ${subject}` : ""}
            {step === 5 && chapter ? ` · ${chapter}` : ""}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-5 gap-2 mt-6 mb-8">
        {STEP_LABELS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i + 1 <= step ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="space-y-3">
        {step === 1 &&
          STANDARDS.map((s) => (
            <PillOption
              key={s}
              label={s}
              onClick={() => {
                setStandard(s);
                setStep(2);
              }}
            />
          ))}

        {step === 2 &&
          EXAMS.map((e) => (
            <PillOption
              key={e}
              label={e}
              onClick={() => {
                setExam(e);
                setStep(3);
              }}
            />
          ))}

        {step === 3 &&
          SUBJECTS.map((sub) => (
            <RowOption
              key={sub}
              label={sub}
              onClick={() => {
                setSubject(sub);
                setStep(4);
              }}
            />
          ))}

        {step === 4 &&
          chapters.map((c) => {
            const count = notes.filter(
              (n) =>
                n.standard === standard &&
                n.exam === exam &&
                n.subject === subject &&
                n.chapter === c
            ).length;
            return (
              <RowOption
                key={c}
                label={c}
                meta={`${count} notes`}
                onClick={() => {
                  setChapter(c);
                  setStep(5);
                }}
              />
            );
          })}

        {step === 5 && (
          <div className="space-y-3">
            {filteredNotes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <p className="text-muted-foreground">No notes yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Tap “Manage” to add your first note.
                </p>
              </div>
            ) : (
              filteredNotes.map((n) => (
                <a
                  key={n.id}
                  href={n.link || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl bg-card border border-border p-4 hover:border-primary transition-colors shadow-[var(--shadow-soft)]"
                >
                  <div className="font-semibold">{n.title}</div>
                  {n.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {n.description}
                    </div>
                  )}
                  {n.link && (
                    <div className="text-xs text-primary mt-2 truncate">{n.link}</div>
                  )}
                </a>
              ))
            )}
          </div>
        )}
      </div>

      {/* Floating Manage button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className="fixed bottom-8 right-8 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-primary-foreground font-medium shadow-[var(--shadow-elegant)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus className="h-5 w-5" /> Manage
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle>Add note</SheetTitle>
            <SheetDescription>
              Paste any web link (https://…). Google Drive / Docs links still open in
              preview when possible.
            </SheetDescription>
          </SheetHeader>
          <AddNoteForm
            defaults={{
              standard: standard ?? "",
              exam: exam ?? "",
              subject: subject ?? "",
              chapter: chapter ?? "",
            }}
            onSave={(n) => {
              setNotes((prev) => [...prev, { ...n, id: crypto.randomUUID() }]);
              setOpen(false);
              toast.success("Note saved");
            }}
          />
        </SheetContent>
      </Sheet>

      {step === 5 && (
        <div className="mt-10 flex justify-center">
          <Button variant="outline" onClick={reset}>
            Start over
          </Button>
        </div>
      )}
    </div>
  );
}

function PillOption({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-full bg-step-pill text-step-pill-foreground py-5 text-lg font-medium hover:brightness-95 transition shadow-[var(--shadow-soft)]"
    >
      {label}
    </button>
  );
}

function RowOption({
  label,
  meta,
  onClick,
}: {
  label: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between rounded-2xl bg-card border border-border px-5 py-4 text-left hover:border-primary hover:shadow-[var(--shadow-soft)] transition-all"
    >
      <div>
        <div className="font-semibold text-foreground">{label}</div>
        {meta && <div className="text-xs text-muted-foreground mt-0.5">{meta}</div>}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}

function AddNoteForm({
  defaults,
  onSave,
}: {
  defaults: { standard: string; exam: string; subject: string; chapter: string };
  onSave: (n: Omit<Note, "id">) => void;
}) {
  const [form, setForm] = useState({
    standard: defaults.standard,
    exam: defaults.exam,
    subject: defaults.subject,
    chapter: defaults.chapter,
    title: "",
    description: "",
    link: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.link) {
      toast.error("Title and link are required");
      return;
    }
    onSave(form);
  };

  const subjectChapters = form.subject ? CHAPTERS[form.subject] ?? [] : [];

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <SelectField label="Standard" value={form.standard} onChange={set("standard")} options={STANDARDS} />
      <SelectField label="Exam" value={form.exam} onChange={set("exam")} options={EXAMS} />
      <SelectField label="Subject" value={form.subject} onChange={set("subject")} options={SUBJECTS} />
      <SelectField label="Chapter" value={form.chapter} onChange={set("chapter")} options={subjectChapters} />
      <Input placeholder="Title" value={form.title} onChange={set("title")} />
      <Textarea placeholder="Description" value={form.description} onChange={set("description")} />
      <Input placeholder="Resource link (https://…)" value={form.link} onChange={set("link")} />
      <Button
        type="submit"
        className="w-full h-12 rounded-full text-base"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Save className="h-4 w-4 mr-2" /> Save
      </Button>
    </form>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
