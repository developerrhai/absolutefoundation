"use client"

import { useState } from "react"
import Image from "next/image"
import { Header } from "@/components/ui/header"

const STEPS = ["Basic Details", "Academic", "Family & Contact", "Other Info"]

const BATCHES = [
  "Offline",
  "Online",
]

const STANDARDS = [
  "1st Standard", "2nd Standard", "3rd Standard",
  "4rth Standard", "5th Standard", "6th Standard",
  "7th Standard", "8th Standard", "9th Standard",
  "10th Standard", "11th Standard", "12th Standard",
]

const REFERENCES = [
  "Social Media (Instagram/Facebook)",
  "Google",
  "Hoarding",
  "Website",
  "Justdial",
  "Friends",
  "Pamphlets",
  "Other",
]

interface FormData {
  studentName: string
  dob: string
  studentContact: string
  parentContact: string
  fatherName: string         // NEW
  location: string           // NEW
  batch: string
  standard: string
  lastExamMarks: string
  collegeName: string
  collegeTiming: string
  fatherOccupation: string
  motherOccupation: string
  address: string
  email: string
  futurePlans: string
  reference: string
  siblingName: string
  sex: string
  takingCoaching: string
  hostelRequired: string
}

const initial: FormData = {
  studentName: "",
  dob: "",
  studentContact: "",
  parentContact: "",
  fatherName: "",        // NEW
  location: "",          // NEW
  batch: "",
  standard: "",
  lastExamMarks: "",
  collegeName: "",
  collegeTiming: "",
  fatherOccupation: "",
  motherOccupation: "",
  address: "",
  email: "",
  futurePlans: "",
  reference: "",
  siblingName: "",
  sex: "",
  takingCoaching: "",
  hostelRequired: "",
}


export default function InquiryFormPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const set = (key: keyof FormData, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const progress = ((step) / STEPS.length) * 100

  const validateStep = () => {
    if (step === 0) {
      if (!form.studentName.trim()) return "Student name is required"
      if (!form.studentContact.trim()) return "Student contact is required"
      if (!form.parentContact.trim()) return "Parent contact is required"
    }
    if (step === 1) {
      if (!form.batch) return "Please select a batch"
      if (!form.standard) return "Please select a standard"
    }
    if (step === 2) {
      if (!form.address.trim()) return "Address is required"
    }
    if (step === 3) {
      if (!form.reference) return "Please select how you heard about us"
      if (!form.sex) return "Please select gender"
    }
    return ""
  }

  const next = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError("")
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  const back = () => { setError(""); setStep(s => Math.max(s - 1, 0)) }

 const handleSubmit = async () => {
  const err = validateStep()
  if (err) { setError(err); return }
  setError("")
  setSubmitting(true)
  try {
   const payload = {
  name: form.studentName,             // maps to 'name'
  phone: form.studentContact,         // maps to 'phone'
  father_name: "",                    // add a field for parent's name if needed
  father_phone: form.parentContact,   // maps to 'father_phone'
  course: form.batch,                 // you can use 'batch' or 'course'
  location: "",                        // add location field if needed
  board: "",                            // optional
  standard: form.standard,
  status: "New",
  video: "",                           // optional
  dob: form.dob,
  email: form.email,
  address: form.address,
  college_name: form.collegeName,
  college_timing: form.collegeTiming,
  last_exam_marks: form.lastExamMarks,
  father_occupation: form.fatherOccupation,
  mother_occupation: form.motherOccupation,
  future_plans: form.futurePlans,
  reference: form.reference,
  sibling_name: form.siblingName,
  sex: form.sex,
  taking_coaching: form.takingCoaching,
  hostel_required: form.hostelRequired,
  admin_id: 0,                        // default
  // inquiry_date will default to current date in DB
}

    const res = await fetch("https://institute-api.rhaitech.online/api/inquiries/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.success) {
      setSubmitted(true)
    } else {
      setError(data.message || "Submission failed. Please try again.")
    }
  } catch {
    setError("Network error. Please check your connection and try again.")
  } finally {
    setSubmitting(false)
  }
}

  if (submitted) {
    return (
        <div className="min-h-screen bg-[#e8f4f8] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-[#0d6efd] to-[#0dcaf0]" />
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Form Submitted!</h2>
            <p className="text-gray-500 mb-1">
              Thank you, <span className="font-semibold text-[#0d6efd]">{form.studentName}</span>
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Our team will call you at <span className="text-gray-600 font-medium">{form.studentContact}</span>  within 24 hours..
            </p>
            <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-700 font-medium">
              DNYANSAGAR
            </div>
            <p className="text-amber-400 text-sm pt-1">Believe to Proceed, Pursue with Finesse</p>

          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Background decoration */}
      

      <div className="relative z-10 flex flex-col items-center px-4 py-8 md:py-12">

        {/* Header */}
        <div className="w-full max-w-2xl">
        
         <Header/>
        </div>

        {/* Progress Steps */}
        <div className="w-full max-w-2xl bg-white pt-8">
          <div className="flex items-center  justify-between mb-3">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-1.5 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 
                ${
                  i < step ? "bg-teal-500 border-teal-500 text-white" :
                  i === step ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/40" :
                  "bg-transparent border-[#0b7abf]/20 text-[#0b7abf]/30"
                }
                
                `}>
                  {i < step ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block text-center leading-tight ${
                  i === step ? "text-amber-400" : i < step ? "text-teal-400" : "text-white/30"
                }`}>
                  {label}
                </span>
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="absolute" style={{ display: "none" }} />
                )}
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-gradient-to-br from-[#0b3d6b] via-[#0d5c9e] to-[#0b7abf] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-amber-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs mt-2 text-right">Step {step + 1} of {STEPS.length}</p>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-2xl">
          <div className="bg-[#fff] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">

            {/* Step Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <span className="text-amber-400 font-bold text-sm">{step + 1}</span>
                </div>
                <div>
                  <h3 className="text-black font-bold text-lg">{STEPS[step]}</h3>
                  <p className="text-slate-500 text-xs">
                    {step === 0 && "Tell us about yourself"}
                    {step === 1 && "Your academic background"}
                    {step === 2 && "Family & contact information"}
                    {step === 3 && "A few more details"}
                  </p>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="p-6 space-y-4">

              {/* STEP 0 — Basic Details */}
              {step === 0 && (
                <>
                  <Field label="Student Full Name" required>
                    <input
                      type="text" placeholder="Enter full name"
                      value={form.studentName} onChange={e => set("studentName", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Date of Birth">
                    <input
                      type="date"
                      value={form.dob} onChange={e => set("dob", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Student Contact" required>
                      <input
                        type="tel" placeholder="+91 XXXXX XXXXX"
                        value={form.studentContact} onChange={e => set("studentContact", e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Parent Contact" required>
                      <input
                        type="tel" placeholder="+91 XXXXX XXXXX"
                        value={form.parentContact} onChange={e => set("parentContact", e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </>
              )}

              {/* STEP 1 — Academic */}
              {step === 1 && (
                <>
                  <Field label="Select Batch" required>
                    <select value={form.batch} onChange={e => set("batch", e.target.value)} className={selectCls}>
                      <option value="">-- Select Batch --</option>
                      {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </Field>
                  <Field label="Select Standard" required>
                    <select value={form.standard} onChange={e => set("standard", e.target.value)} className={selectCls}>
                      <option value="">-- Select Standard --</option>
                      {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Last Exam Marks / Grade %">
                    <input
                      type="text" placeholder="e.g. 85% or A+"
                      value={form.lastExamMarks} onChange={e => set("lastExamMarks", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="College Name">
                      <input
                        type="text" placeholder="College / School name"
                        value={form.collegeName} onChange={e => set("collegeName", e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="College Timing">
                      <input
                        type="text" placeholder="e.g. 8AM – 12PM"
                        value={form.collegeTiming} onChange={e => set("collegeTiming", e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </>
              )}

              {/* STEP 2 — Family & Contact */}
              {step === 2 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Father's Occupation">
                      <input
                        type="text" placeholder="e.g. Business, Service"
                        value={form.fatherOccupation} onChange={e => set("fatherOccupation", e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Mother's Occupation">
                      <input
                        type="text" placeholder="e.g. Homemaker, Teacher"
                        value={form.motherOccupation} onChange={e => set("motherOccupation", e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                  <Field label="Residential Address" required>
                    <textarea
                      placeholder="Full address with area, city, pincode"
                      value={form.address} onChange={e => set("address", e.target.value)}
                      rows={3}
                      className={inputCls + " resize-none"}
                    />
                  </Field>
                  <Field label="Email Address">
                    <input
                      type="email" placeholder="student@email.com"
                      value={form.email} onChange={e => set("email", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Future Plans / Goals">
                    <input
                      type="text" placeholder="e.g. IIT, NEET, CA, MBA..."
                      value={form.futurePlans} onChange={e => set("futurePlans", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </>
              )}

              {/* STEP 3 — Other Info */}
              {step === 3 && (
                <>
                  <Field label="How did you hear about us?" required>
                    <select value={form.reference} onChange={e => set("reference", e.target.value)} className={selectCls}>
                      <option value="">-- Select Reference --</option>
                      {REFERENCES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Sibling Name (if any)">
                      <input
                        type="text" placeholder="Brother / Sister name"
                        value={form.siblingName} onChange={e => set("siblingName", e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Gender" required>
                      <select value={form.sex} onChange={e => set("sex", e.target.value)} className={selectCls}>
                        <option value="">-- Select --</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Taking Coaching Elsewhere?">
                      <select value={form.takingCoaching} onChange={e => set("takingCoaching", e.target.value)} className={selectCls}>
                        <option value="">-- Select --</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </Field>
                    <Field label="Hostel Required?">
                      <select value={form.hostelRequired} onChange={e => set("hostelRequired", e.target.value)} className={selectCls}>
                        <option value="">-- Select --</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </Field>
                  </div>

                  {/* Confirmation notice */}
                  <div className="mt-2 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <p className="text-amber-400/80 text-xs leading-relaxed">
                      ✦ By submitting, you confirm that all details provided are correct and accurate.
                      Our counsellor will reach out to you shortly.
                    </p>
                  </div>
                </>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="px-6 pb-6 flex items-center justify-between gap-4">
              <button
                onClick={back}
                disabled={step === 0}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-slate-400 hover:text-white border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  onClick={next}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-teal-500/25 transition-all duration-200 hover:shadow-teal-500/40 hover:-translate-y-0.5"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all duration-200 hover:shadow-amber-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Form
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-slate-600 text-xs text-center">
          @ DNYANSAGAR · All rights reserved
        </p>
      </div>
    </div>
  )
}

/* ── Reusable field wrapper ─────────────────────────── */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-black">
        {label}
        {required && <span className="text-amber-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = [
  "w-full px-4 py-3 rounded-xl text-sm text-black placeholder-slate-500",
  "bg-white/5 border border-gray-200",
  "focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 focus:bg-white/8",
  "transition-all duration-200",
].join(" ")

const selectCls = [
  "w-full px-4 py-3 rounded-xl text-sm text-black",
  "bg-white border border-gray-200",
  "focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20",
  "transition-all duration-200 appearance-none cursor-pointer",
].join(" ")
