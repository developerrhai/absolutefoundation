"use client"

import { useState } from "react"

const TEACHERS = [
  "Dr. Anil Mehta",
  "Mrs. Sunita Rao",
  "Mr. Rajesh Kumar",
  "Ms. Priya Sharma",
  "Mr. Vikram Patil",
]

const BATCHES = [
  "Morning Batch (7AM – 9AM)",
  "Afternoon Batch (12PM – 2PM)",
  "Evening Batch (5PM – 7PM)",
  "Weekend Batch (Sat–Sun)",
]

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology",
  "English", "History", "Geography", "Economics",
  "Computer Science", "Accountancy", "Business Studies",
]

const BRANCHES = ["Chinchwad", "Wakad", "Thergaon", "Pimpri", "Nigdi"]

interface FormData {
  teacher_name: string
  batch:        string
  subject:      string
  chapter:      string
  topic:        string
  branch:       string
  class_date:   string
  class_time:   string
  remarks:      string
}

const initial: FormData = {
  teacher_name: "", batch: "", subject: "", chapter: "",
  topic: "", branch: "", class_date: "", class_time: "", remarks: "",
}

const today = new Date().toISOString().split("T")[0]

export default function TeacherUpdatePage() {
  const [form,       setForm]       = useState<FormData>({ ...initial, class_date: today })
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [error,      setError]      = useState("")
  const [touched,    setTouched]    = useState<Partial<Record<keyof FormData, boolean>>>({})

  const set = (key: keyof FormData, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setTouched(prev => ({ ...prev, [key]: true }))
    setError("")
  }

  const required: (keyof FormData)[] = [
    "teacher_name","batch","subject","chapter","topic","branch","class_date","class_time"
  ]

  const fieldErr = (key: keyof FormData) => {
    if (!touched[key]) return ""
    if (required.includes(key) && !form[key].trim()) return "Required"
    return ""
  }

  const validate = () => {
    const t: Partial<Record<keyof FormData, boolean>> = {}
    required.forEach(k => { t[k] = true })
    setTouched(t)
    for (const k of required) {
      if (!form[k].trim()) return "Please fill all required fields"
    }
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError("")
    setSubmitting(true)
    try {
      const res  = await fetch("https://institute-api.rhaitech.online/api/teacher-updates/public", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) setSubmitted(true)
      else setError(data.message || "Submission failed. Please try again.")
    } catch {
      setError("Network error. Please check your connection.")
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setForm({ ...initial, class_date: today })
    setTouched({})
    setError("")
    setSubmitted(false)
  }

  /* ── Success ──────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Update Submitted!</h2>
          <p className="text-slate-400 mb-6">Class update recorded successfully for</p>

          {/* Summary card */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 text-left space-y-3 mb-6">
            {[
              { icon: "👨‍🏫", label: "Teacher",  value: form.teacher_name },
              { icon: "📚", label: "Subject",   value: form.subject },
              { icon: "📖", label: "Chapter",   value: form.chapter },
              { icon: "🔖", label: "Topic",     value: form.topic },
              { icon: "🏫", label: "Batch",     value: form.batch },
              { icon: "📍", label: "Branch",    value: form.branch },
              { icon: "📅", label: "Date",      value: form.class_date },
              { icon: "⏰", label: "Time",      value: form.class_time },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="text-base mt-0.5">{icon}</span>
                <div>
                  <p className="text-slate-500 text-xs">{label}</p>
                  <p className="text-white text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={reset}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-400 hover:to-orange-400 transition-all duration-200 shadow-lg shadow-amber-500/25"
          >
            Submit Another Update
          </button>
        </div>
      </div>
    )
  }

  /* ── Form ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-teal-500/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/3 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-10">

        {/* Header */}
        <div className="w-full max-w-xl mb-8">
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-800/80 border border-slate-700 backdrop-blur-sm">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">MERIT<span className="text-amber-400">-HOME</span></h1>
                <span className="text-slate-500 text-xs">·</span>
                <span className="text-slate-400 text-xs font-medium tracking-widest uppercase">Learning Centre</span>
              </div>
              <h2 className="text-white font-bold text-lg mt-0.5">Teacher Class Update</h2>
              <p className="text-slate-400 text-xs mt-0.5">Record today's class details for student tracking</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-xl">
          <form onSubmit={handleSubmit} noValidate>
            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">

              {/* Top bar */}
              <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-teal-400" />

              <div className="p-6 space-y-6">

                {/* ── Row 1: Teacher + Branch ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputGroup
                    label="Teacher Name" required icon="👨‍🏫"
                    value={form.teacher_name}
                    onChange={v => set("teacher_name", v)}
                    placeholder="Enter Teacher Name"
                    error={fieldErr("teacher_name")}
                    />
                  <SelectGroup
                    label="Branch" required icon="📍"
                    value={form.branch} onChange={v => set("branch", v)}
                    options={BRANCHES} placeholder="Select Branch"
                    error={fieldErr("branch")}
                  />
                </div>

                {/* ── Row 2: Batch + Subject ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectGroup
                    label="Batch" required icon="🏫"
                    value={form.batch} onChange={v => set("batch", v)}
                    options={BATCHES} placeholder="Select Batch"
                    error={fieldErr("batch")}
                  />
                  <SelectGroup
                    label="Subject" required icon="📚"
                    value={form.subject} onChange={v => set("subject", v)}
                    options={SUBJECTS} placeholder="Select Subject"
                    error={fieldErr("subject")}
                  />
                </div>

                {/* ── Divider ── */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-700" />
                  <span className="text-slate-500 text-xs font-medium tracking-wider uppercase">Syllabus Covered</span>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>

                {/* ── Chapter ── */}
                <InputGroup
                  label="Chapter" required icon="📖"
                  value={form.chapter} onChange={v => set("chapter", v)}
                  placeholder="e.g. Trigonometry, Organic Chemistry..."
                  error={fieldErr("chapter")}
                />

                {/* ── Topic ── */}
                <InputGroup
                  label="Topic" required icon="🔖"
                  value={form.topic} onChange={v => set("topic", v)}
                  placeholder="e.g. Sin & Cos rules, Alkanes & Alkenes..."
                  error={fieldErr("topic")}
                />

                {/* ── Divider ── */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-700" />
                  <span className="text-slate-500 text-xs font-medium tracking-wider uppercase">Schedule</span>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>

                {/* ── Date + Time ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputGroup
                    label="Class Date" required icon="📅" type="date"
                    value={form.class_date} onChange={v => set("class_date", v)}
                    error={fieldErr("class_date")}
                  />
                  <InputGroup
                    label="Class Time" required icon="⏰" type="time"
                    value={form.class_time} onChange={v => set("class_time", v)}
                    error={fieldErr("class_time")}
                  />
                </div>

                {/* ── Remarks (optional) ── */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <span>💬</span> Remarks
                    <span className="text-slate-500 font-normal text-xs">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any notes, homework given, doubts discussed..."
                    value={form.remarks}
                    onChange={e => set("remarks", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15 transition-all duration-200 resize-none"
                  />
                </div>

                {/* ── Error ── */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* ── Submit ── */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-base tracking-wide shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Submit Class Update
                    </>
                  )}
                </button>

              </div>
            </div>
          </form>
        </div>

        <p className="mt-6 text-slate-600 text-xs text-center">
          © DNYANSAGAR· All rights reserved
        </p>
      </div>
    </div>
  )
}

/* ── Reusable: Input group ──────────────────────────── */
function InputGroup({
  label, required: req, icon, type = "text",
  value, onChange, placeholder, error,
}: {
  label: string; required?: boolean; icon: string; type?: string
  value: string; onChange: (v: string) => void
  placeholder?: string; error?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-300">
        <span>{icon}</span> {label}
        {req && <span className="text-amber-400 text-xs">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-900/60 border transition-all duration-200 focus:outline-none focus:ring-2
          ${error
            ? "border-red-500/50 bg-red-500/5 focus:border-red-500/60 focus:ring-red-500/15"
            : "border-slate-600 focus:border-amber-500/60 focus:ring-amber-500/15 hover:border-slate-500"
          }`}
      />
      {error && <p className="text-red-400 text-xs ml-1">{error}</p>}
    </div>
  )
}

/* ── Reusable: Select group ─────────────────────────── */
function SelectGroup({
  label, required: req, icon,
  value, onChange, options, placeholder, error,
}: {
  label: string; required?: boolean; icon: string
  value: string; onChange: (v: string) => void
  options: string[]; placeholder: string; error?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-300">
        <span>{icon}</span> {label}
        {req && <span className="text-amber-400 text-xs">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl text-sm bg-slate-900/60 border appearance-none cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2
            ${error
              ? "border-red-500/50 text-red-300 bg-red-500/5 focus:border-red-500/60 focus:ring-red-500/15"
              : "border-slate-600 text-white focus:border-amber-500/60 focus:ring-amber-500/15 hover:border-slate-500"
            } ${!value ? "text-slate-500" : "text-white"}`}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map(o => <option key={o} value={o} className="bg-slate-800 text-white">{o}</option>)}
        </select>
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error && <p className="text-red-400 text-xs ml-1">{error}</p>}
    </div>
  )
}
