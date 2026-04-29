"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Plus, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
// Ensure you export getBranches, getBatches from your notesApi!
import { 
  getBranches, getBatches, getBoards, getStandards, 
  getSubjects, getChapters, getNotes, createCategories, getTeachers 
} from "@/lib/notesApi";

type Note = {
  note_id: string;
  title: string;
  description: string;
  file_url: string;
};

const STEP_LABELS = [
  "Select Branch",
  "Select Batch",
  "Select Board",
  "Select Standard",
  "Select Subject",
  "Select Chapter",
  "Notes",
];

const ADD_LABELS = [
  "Add Branch",
  "Add Batch",
  "Add Board",
  "Add Standard",
  "Add Subject",
  "Add Chapter",
  "Add Note",
];

export function NotesWizard() {
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState(false);

  // Data states
  const [branches, setBranches] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [standards, setStandards] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // Selection states
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [selectedBoard, setSelectedBoard] = useState<any>(null);
  const [selectedStandard, setSelectedStandard] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);

  // --- Fetch Methods ---
  const loadBranches = async () => {
    try {
      const data = await getBranches();
      console.log("Fetched Branches:", data);
      setBranches(data?.data?.branches || data?.branches || []);
    } catch (err) { toast.error("Failed to load branches"); }
  };

  const fetchBatches = async (branch_id: number) => {
    try {
      const data = await getBatches(branch_id);
      console.log("Fetched Batches:", data);
      setBatches(data?.data || data || []);
    } catch (err) { toast.error("Failed to load batches"); }
  };

  const loadBoards = async () => {
    try {
      const data = await getBoards();
      setBoards(data?.data || data || []);
    } catch (err) { toast.error("Failed to load boards"); }
  };

  const fetchStandards = async (board_id: number, batch_id: number, branch_id: number) => {
    try {
      const data = await getStandards(board_id, batch_id, branch_id);
      setStandards(data?.data || data || []);
    } catch (err) { toast.error("Failed to load standards"); }
  };

  const fetchSubjects = async (stand_id: number, branch_id: number, batch_id: number, board_id: number) => {
    try {
      const data = await getSubjects(stand_id, branch_id, batch_id, board_id );
      setSubjects(data?.data || data || []);
    } catch (err) { toast.error("Failed to load subjects"); }
  };

  const fetchChapters = async (sub_id: number, stand_id: number,  branch_id: number, batch_id: number, board_id: number) => {
    try {
      const data = await getChapters(sub_id, stand_id, branch_id, batch_id, board_id);
      setChapters(data?.data || data || []);
    } catch (err) { toast.error("Failed to load chapters"); }
  };

  const fetchNotes = async (chap_id: number, sub_id: number, stand_id: number,  branch_id: number, batch_id: number, board_id: number) => {
    try {
      const data = await getNotes(chap_id, sub_id, stand_id, branch_id, batch_id, board_id);
      setNotes(data?.data || data || []);
    } catch (err) { toast.error("Failed to load notes"); }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const goBack = () => {
    if (step === 1) return;
    setStep((s) => s - 1);
  };

  const reset = () => {
    setStep(1);
    setBatches([]); setBoards([]); setStandards([]); 
    setSubjects([]); setChapters([]); setNotes([]);
    setSelectedBranch(null); setSelectedBatch(null); setSelectedBoard(null);
    setSelectedStandard(null); setSelectedSubject(null); setSelectedChapter(null);
  };

  const handleSuccessAddition = () => {
    setOpen(false);
    if (step === 1) loadBranches();
    if (step === 2 && selectedBranch) fetchBatches(selectedBranch.branch_id);
    if (step === 3) loadBoards();
    if (step === 4 && selectedBoard && selectedBatch) fetchStandards(selectedBoard.board_id, selectedBatch.batch_id, selectedBranch?.branch_id);
    if (step === 5 && selectedStandard) fetchSubjects(selectedStandard.stand_id, selectedBranch?.branch_id, selectedBatch?.batch_id, selectedBoard?.board_id);
    if (step === 6 && selectedSubject) fetchChapters(selectedSubject.sub_id, selectedStandard?.stand_id, selectedBranch?.branch_id, selectedBatch?.batch_id, selectedBoard?.board_id);
    if (step === 7 && selectedChapter) fetchNotes(selectedChapter.chap_id, selectedSubject.sub_id, selectedStandard?.stand_id, selectedBranch?.branch_id, selectedBatch?.batch_id, selectedBoard?.board_id);
  };

  const renderEmptyState = (label: string) => (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <p className="text-muted-foreground">No {label} yet</p>
      <p className="text-sm text-muted-foreground/70 mt-1">Tap “Manage” to add {label}.</p>
    </div>
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
        </div>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-7 gap-2 mt-6 mb-8">
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
        {/* Step 1: Branch */}
        {step === 1 && (
          <>
            {branches.length === 0 && renderEmptyState("branches")}
            {branches?.map((b) => (
              <PillOption key={b.branch_id} label={b.branch_name} onClick={() => {
                setSelectedBranch(b); fetchBatches(b.branch_id); setStep(2);
              }} />
            ))}
          </>
        )}

        {/* Step 2: Batch */}
        {step === 2 && (
          <>
            {batches.length === 0 && renderEmptyState("batches")}
            {batches?.map((b) => (
              <PillOption key={b.batch_id} label={`${b.batch_name} (${b.start_time} - ${b.end_time})`} onClick={() => {
                setSelectedBatch(b); loadBoards(); setStep(3);
              }} />
            ))}
          </>
        )}

        {/* Step 3: Board */}
        {step === 3 && (
          <>
            {boards.length === 0 && renderEmptyState("boards")}
            {boards?.map((b) => (
              <PillOption key={b.board_id} label={b.name} onClick={() => {
                setSelectedBoard(b); fetchStandards(b.board_id, selectedBatch?.batch_id, selectedBranch?.branch_id); setStep(4);
              }} />
            ))}
          </>
        )}

        {/* Step 4: Standard */}
        {step === 4 && (
          <>
            {standards.length === 0 && renderEmptyState("standards")}
            {standards?.map((s) => (
              <PillOption key={s.stand_id} label={s.name} onClick={() => {
                setSelectedStandard(s); fetchSubjects(s.stand_id, selectedBranch?.branch_id, selectedBatch?.batch_id, selectedBoard?.board_id); setStep(5);
              }} />
            ))}
          </>
        )}

        {/* Step 5: Subject */}
  {/* Step 5: Subject */}
{step === 5 && (
  <>
    {subjects.length === 0 && renderEmptyState("subjects")}
    {subjects?.map((sub) => (
      <RowOption 
        key={sub.sub_id} 
        label={sub.name} 
        // Display the teacher name if it exists in the subject record
        meta={sub.teacher_name ? `Teacher: ${sub.teacher_name}` : "No teacher assigned"} 
        onClick={() => {
          setSelectedSubject(sub); 
          fetchChapters(sub.sub_id, selectedStandard?.stand_id, selectedBranch?.branch_id, selectedBatch?.batch_id, selectedBoard?.board_id); 
          setStep(6);
        }} 
      />
    ))}
  </>
)}

        {/* Step 6: Chapter */}
        {/* Step 6: Chapter */}
{step === 6 && (
  <div className="space-y-4">
    {chapters.length === 0 && renderEmptyState("chapters")}
    {chapters?.map((chap) => (
      <RowOption 
        key={chap.chap_id} 
        label={chap.name || chap.chapter_name} 
        meta={chap.description} 
        onClick={() => {
          setSelectedChapter(chap); 
          fetchNotes(chap.chap_id,selectedSubject?.sub_id, selectedStandard?.stand_id, selectedBranch?.branch_id, selectedBatch?.batch_id, selectedBoard?.board_id); 
          setStep(7);
        }}
      >
        {/* Nested Topic List */}
        <div className="border-l-2 border-primary/20 pl-4 space-y-2">
          {chap?.topics && chap.topics.length > 0 ? (
            chap?.topics?.map((topic: any, idx: number) => (
              <div key={idx} className="bg-muted/40 p-3 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{topic.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {topic.start_date ? new Date(topic.start_date).toLocaleDateString() : 'N/A'} 
                    {" — "} 
                    {topic.end_date ? new Date(topic.end_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="h-2 w-2 rounded-full bg-primary/40" />
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic pl-2">No topics defined for this chapter.</p>
          )}
        </div>
      </RowOption>
    ))}
  </div>
)}

        {/* Step 7: Notes */}
        {step === 7 && (
          <>
            {notes.length === 0 && renderEmptyState("notes")}
            {notes?.map((n) => (
              <RowOption key={n.note_id} label={n.title} meta={"Click to view note"} onClick={() => {
                window.open(n.file_url, "_blank");
              }} />
            ))}
          </>
        )}
      </div>

      {/* Floating Manage button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className="fixed bottom-8 right-8 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-primary-foreground font-medium shadow-[var(--shadow-elegant)] hover:scale-[1.02] active:scale-[0.98] transition-transform z-50"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus className="h-5 w-5" /> Manage
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle>{ADD_LABELS[step - 1]}</SheetTitle>
          </SheetHeader>
          <AddNoteForm
            step={step}
            parentIds={{
              branch_id: selectedBranch?.branch_id,
              batch_id: selectedBatch?.batch_id,
              board_id: selectedBoard?.board_id,
              stand_id: selectedStandard?.stand_id,
              sub_id: selectedSubject?.sub_id,
              chap_id: selectedChapter?.chap_id,
            }}
            onSuccess={handleSuccessAddition}
          />
        </SheetContent>
      </Sheet>

      {step === 7 && (
        <div className="mt-10 flex justify-center">
          <Button variant="outline" onClick={reset}>Start over</Button>
        </div>
      )}
    </div>
  );
}

// --- Subcomponents ---

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
  children 
}: { 
  label: string; 
  meta?: string; 
  onClick: () => void;
  children?: React.ReactNode; // For nested topics
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full space-y-2">
      <div
        className="w-full flex items-center justify-between rounded-2xl bg-card border border-border px-5 py-4 text-left hover:border-primary hover:shadow-[var(--shadow-soft)] transition-all cursor-pointer"
        onClick={onClick}
      >
        <div className="flex-1">
          <div className="font-semibold text-foreground">{label}</div>
          {meta && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{meta}</div>}
        </div>
        
        {/* Chevron logic: click to expand topics without triggering the main onClick */}
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Prevents moving to Step 7
            setIsExpanded(!isExpanded);
          }}
          className="ml-4 p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ChevronRight className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-90"
          )} />
        </button>
      </div>

      {/* Expanded Topics List */}
      {isExpanded && children && (
        <div className="ml-6 space-y-2 animate-in fade-in slide-in-from-top-2">
          {children}
        </div>
      )}
    </div>
  );
}
// --- The Dynamic Form Component ---
function AddNoteForm({
  step,
  parentIds,
  onSuccess,
}: {
  step: number;
  parentIds: any;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  // General Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<string>("");

  // Batch Specific Fields
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // --- NEW: Topic Fields for Step 6 ---
  const [topics, setTopics] = useState<any[]>([
    { topic_name: "", start_date: "", end_date: "" }
  ]);

  const addTopicField = () => {
    setTopics([...topics, { topic_name: "", start_date: "", end_date: "" }]);
  };

  const updateTopic = (index: number, field: string, value: string) => {
    const newTopics = [...topics];
    newTopics[index][field] = value;
    setTopics(newTopics);
  };

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };


  useEffect(() => {
  if (step === 5) {
    const loadTeachers = async () => {
      try {
        const res = await getTeachers(); // Ensure this API call exists
        setTeachers(res.data || []);
      } catch (err) {
        toast.error("Failed to load teachers");
      }
    };
    loadTeachers();
  }
}, [step]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let endpoint = "";
      let payload: any = {};

      if (step === 1) { // Branch
        if (!name) return toast.error("Name is required");
        endpoint = "/branches/";
        payload = { branch_name: name };
      } 
      else if (step === 2) { // Batch
        if (!name || !startTime || !endTime || !startDate || !endDate) return toast.error("All batch fields are required");
        endpoint = "/batches/";
        payload = { 
          branch_id: parentIds.branch_id, 
          batch_name: name, 
          start_time: startTime, 
          end_time: endTime, 
          batch_start_date: startDate, 
          batch_end_date: endDate 
        };
      } 
      else if (step === 3) { // Board
        if (!name) return toast.error("Name is required");
        endpoint = "/boards/";
        payload = { name };
      } 
      else if (step === 4) { // Standard
        if (!name) return toast.error("Name is required");
        endpoint = "/standards/";
        payload = { board_id: parentIds.board_id, batch_id: parentIds.batch_id, name };
      } 
      else if (step === 5) { // Subject
        if (!name) return toast.error("Name is required");
        endpoint = "/subjects/";
        payload = { 
          stand_id: parentIds.stand_id, 
          name, 
          teacher_id: selectedTeacherId || null // Send the teacher ID to the subject controller
        };
      }
      else if (step === 6) { // Chapter
        if (!name || !description) return toast.error("Name & Description required");
        
        // Filter out empty topics before sending
        const validTopics = topics.filter(t => t.topic_name.trim() !== "");
        
        endpoint = "/chapters/";
        payload = { 
          sub_id: parentIds.sub_id, 
          name, 
          description, 
          topics: validTopics 
        };
      } 
      else if (step === 7) { // Notes
        if (!title || !file) return toast.error("Title and File are required");
        endpoint = "/notes/";
        payload = { chap_id: parentIds.chap_id, title, file_url: file };
      }

      await postData(endpoint, payload);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const postData = async (url: string, data: any) => {
    try {
      const res = await createCategories(url, data);
      if (!res?.message && !res?.success) throw new Error("Failed to create record");

      toast.success(res?.message || "Created successfully");

      // Reset form
      setName(""); setDescription(""); setTitle(""); setFile("");
      setStartTime(""); setEndTime(""); setStartDate(""); setEndDate("");
      setTopics([{ topic_name: "", start_date: "", end_date: "" }]); // Reset topics
      onSuccess();
    } catch (err) {
      toast.error("API Request Failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      
      {/* Standard Name Inputs (Steps 1-6) */}
      {step <= 6 && (
        <Input
          placeholder={
            step === 1 ? "Branch Name" : step === 2 ? "Batch Name" : step === 3 ? "Board Name" : 
            step === 4 ? "Standard Name" : step === 5 ? "Subject Name" : "Chapter Name"
          }
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
      )}

      {/* Step 5: Subject Inputs */}
      {step === 5 && (

          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">
              Assign Teacher (Optional)
            </label>
            <select 
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              disabled={loading}
            >
              <option value="">Select a Teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
      )}
      {/* Specific Batch Inputs (Step 2) */}
      {step === 2 && (
        <div className="grid grid-cols-2 gap-4">
          <Input type="time" placeholder="Start Time" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={loading} />
          <Input type="time" placeholder="End Time" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={loading} />
          <Input type="date" placeholder="Start Date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={loading} />
          <Input type="date" placeholder="End Date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={loading} />
        </div>
      )}

      {/* Chapter Details & Dynamic Topics (Step 6) */}
      {step === 6 && (
        <div className="space-y-4">
          <Textarea
            placeholder="Chapter Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
          
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">Topics</h4>
              <Button type="button" variant="outline" size="sm" onClick={addTopicField} className="h-8">
                <Plus className="h-3 w-3 mr-1" /> Add Topic
              </Button>
            </div>
            
            {topics.map((topic, index) => (
              <div key={index} className="p-3 border rounded-xl bg-muted/30 space-y-2 relative">
                <Input 
                  placeholder="Topic Name" 
                  value={topic.topic_name} 
                  onChange={(e) => updateTopic(index, "topic_name", e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Start</label>
                    <Input type="date" value={topic.start_date} onChange={(e) => updateTopic(index, "start_date", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">End</label>
                    <Input type="date" value={topic.end_date} onChange={(e) => updateTopic(index, "end_date", e.target.value)} />
                  </div>
                </div>
                {topics.length > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive h-6 absolute top-1 right-1" 
                    onClick={() => removeTopic(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note Inputs (Step 7) */}
      {step === 7 && (
        <>
          <Input placeholder="Note Title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} />
          <Input placeholder="File URL" value={file} onChange={(e) => setFile(e.target.value)} disabled={loading} className="pt-2.5" />
        </>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-full text-base mt-2"
        style={{ background: "var(--gradient-primary)" }}
      >
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        {loading ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}