"use client"

import { Header } from "@/components/ui/header"
import { useState } from "react"

const BOARDS = ["CBSE", "ICSE", "State Board", "IB", "IGCSE", "Other", "Cambridge Board"]

const STANDARDS = [
  "1st Standard", "2nd Standard", "3rd Standard",
  "4th Science", "5th Standard", "6th Standard",
  "7th Standard", "8th Standard", "9th Standard",
  "10th Standard", "11th Standard","12th Standard"
]

const BRANCHES = ["Chinchwad", "Wakad", "Thergaon"]

const COURSES = ["IIT-JEE", "NEET", "MHT-CET", "Graduation CET"]

interface FormData {
  studentName: string
  studentPhone: string
  fatherName: string
  fatherPhone: string
  email: string
  // board: string
  standard: string
  // branch: string
  course: string
  father_occupation: string
  adhar_number: string
  profile_img: string
  address: string
  admission_year: string

}

const initial: FormData = {
  studentName: "", studentPhone: "", adhar_number: "", profile_img:"", address: "",
  fatherName: "", fatherPhone: "", father_occupation: "", 
  email: "",  standard: "", course: "",admission_year: ""
}

export default function AdmissionFormPage() {
  const [form, setForm]             = useState<FormData>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]           = useState("")
  const [touched, setTouched]       = useState<Partial<Record<keyof FormData, boolean>>>({})

  const isSenior = form.standard === "11th Standard" || form.standard === "12th Standard"

  const set = (key: keyof FormData, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setTouched(prev => ({ ...prev, [key]: true }))
    setError("")
  }

  const fieldError = (key: keyof FormData) => {
    if (!touched[key]) return ""
    if (!form[key].trim()) return "This field is required"
    if ((key === "studentPhone" || key === "fatherPhone") && !/^\d{10}$/.test(form[key].replace(/\s/g, "")))
      return "Enter a valid 10-digit number"
    return ""
  }

  const validate = () => {
    const required: (keyof FormData)[] = ["studentName","studentPhone","email","fatherName","fatherPhone","father_occupation","standard","adhar_number","profile_img","address","admission_year"]
    if (isSenior) required.push("course")
    const allTouched: Partial<Record<keyof FormData, boolean>> = {}
    required.forEach(k => { allTouched[k] = true })
    setTouched(allTouched)
    for (const k of required) {
      if (!form[k].trim()) return "Please fill all required fields"
    }
    if (!/^\d{10}$/.test(form.studentPhone.replace(/\s/g,""))) return "Enter a valid student phone number"
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email"
    if (!/^\d{10}$/.test(form.fatherPhone.replace(/\s/g,"")))  return "Enter a valid father phone number"
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError("")
    setSubmitting(true)
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/admissions/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:         form.studentName,
          phone:        form.studentPhone,
          father_name:  form.fatherName,
          email:        form.email,
          father_phone: form.fatherPhone,
          father_occupation: form.father_occupation,
          adhar_number: form.adhar_number,
          profile_img: form.profile_img,
          address: form.address,
          admission_year: form.admission_year,
          // board:        form.board,
          standard:     form.standard,
          // location:     form.branch,
          course:       isSenior ? form.course : "",
        }),
      })
      const data = await res.json()
      if (data.success) setSubmitted(true)
      else setError(data.message || "Submission failed. Please try again.")
    } catch(e) {
      console.log("Admission form submission error:", e)
      setError("Network error. Please check your connection.")
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Success screen ─────────────────────────────────── */
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
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Admission Submitted!</h2>
            <p className="text-gray-500 mb-1">
              Thank you, <span className="font-semibold text-[#0d6efd]">{form.studentName}</span>
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Our team will call you at <span className="text-gray-600 font-medium">{form.studentPhone}</span> shortly.
            </p>
            <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-700 font-medium">
              DNYANSAGAR CLASSESS
            </div>
            <button
              onClick={() => { setForm(initial); setTouched({}); setSubmitted(false) }}
              className="mt-6 text-sm text-gray-400 hover:text-gray-600 underline transition-colors"
            >
              Submit another form
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Main Form ──────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#e8f4f8] flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-[42rem]">

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

     
         

          <Header/>

          {/* Form title */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-center text-[#0d6efd] font-bold text-lg tracking-wide">
              Student Admission Form
            </h2>
          </div>

          {/* Form body */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5" noValidate>

            {/* Student Details */}
            <Section label="Student Details" color="blue">
              <InputField
                placeholder="Student Name"
                value={form.studentName}
                onChange={v => set("studentName", v)}
                error={fieldError("studentName")}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
              <InputField
                placeholder="Student Phone"
                type="tel"
                value={form.studentPhone}
                onChange={v => set("studentPhone", v)}
                error={fieldError("studentPhone")}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                }
              />
              <InputField
                placeholder="Email Address"
                type="email"
                value={form.email}
                onChange={v => set("email", v)}
                error={fieldError("email")}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />

              <InputField
                placeholder="Aadhar Number"
                value={form.adhar_number}
                onChange={v => set("adhar_number", v)}
                error={fieldError("adhar_number")}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M3 7h18M3 17h18M4 5h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z"
                      />
                      <circle 
                        cx="8" 
                        cy="12" 
                        r="2" 
                        strokeWidth={2}
                      />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M14 11h4M14 14h4"
                      />
                    </svg>
                }
              />
              <InputField
                placeholder="Address"
                value={form.address}
                onChange={v => set("address", v)}
                error={fieldError("address")}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0L6.343 16.657A8 8 0 1117.657 16.657z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                }
              />
              
              //profile file type input
              <InputField
                placeholder="Profile"
                type="file"
                value={form.profile_img}
                onChange={v => set("profile_img", v)}
                error={fieldError("profile_img")}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
            </Section>

            {/* Parent Details */}
            <Section label="Parent Details" color="indigo">
              <InputField
                placeholder="Father Name"
                value={form.fatherName}
                onChange={v => set("fatherName", v)}
                error={fieldError("fatherName")}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
              <InputField
                placeholder="Father Phone"
                type="tel"
                value={form.fatherPhone}
                onChange={v => set("fatherPhone", v)}
                error={fieldError("fatherPhone")}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                }
              />
              <InputField
                placeholder="Father Occupation"
                value={form.father_occupation}
                onChange={v => set("father_occupation", v)}
                error={fieldError("father_occupation")}
                icon={
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V8a2 2 0 00-2-2h-3V4a2 2 0 00-2-2H11a2 2 0 00-2 2v2H6a2 2 0 00-2 2v5m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4"
                    />
                  </svg>
                }
              />
            </Section>

            {/* Academic Details */}
            <Section label="Academic Details" color="cyan">
              {/* <SelectField
                placeholder="Select Board"
                value={form.board}
                onChange={v => set("board", v)}
                options={BOARDS}
                error={fieldError("board")}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
              /> */}
              <SelectField
                placeholder="Select Standard"
                value={form.standard}
                onChange={v => { set("standard", v); set("course", "") }}
                options={STANDARDS}
                error={fieldError("standard")}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
              />

              {/* Course — only visible for 11th & 12th */}
              {isSenior && (
                <SelectField
                  placeholder="Select Course"
                  value={form.course}
                  onChange={v => set("course", v)}
                  options={COURSES}
                  error={fieldError("course")}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                />
              )}
              <InputField
                placeholder="Admission Year"
                value={form.admission_year}
                onChange={v => set("admission_year", v)}
                error={fieldError("admission_year")}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
                    />
                  </svg>
                }
              />
            </Section>

            {/* Branch */}
            {/* <Section label="Branch" color="sky">
              <SelectField
                placeholder="Select Branch"
                value={form.branch}
                onChange={v => set("branch", v)}
                options={BRANCHES}
                error={fieldError("branch")}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
            </Section> */}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0d6efd] to-[#0dcaf0] text-white font-bold text-base tracking-wide shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
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
                  Submit Admission
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              By submitting, you confirm all details are correct
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          © Vidyaaniketan Professional Academy · All rights reserved
        </p>
      </div>
    </div>
  )
}

/* ── Section wrapper ────────────────────────────────── */
function Section({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    blue:   "text-[#0d6efd] border-[#0d6efd]/20 bg-[#0d6efd]/5",
    indigo: "text-indigo-600 border-indigo-200 bg-indigo-50/50",
    cyan:   "text-cyan-600 border-cyan-200 bg-cyan-50/50",
    sky:    "text-sky-600 border-sky-200 bg-sky-50/50",
  }
  return (
    <div className="space-y-3">
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-bold tracking-wider uppercase ${colors[color]}`}>
        {label}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function InputField({
  placeholder,
  type = "text",
  value,
  onChange,
  error,
  icon
}: {
  placeholder: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
  icon?: React.ReactNode
}) {
  return (
    <div>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-white transition-all duration-200 ${
          error
            ? "border-red-300 bg-red-50/30"
            : "border-gray-200 hover:border-blue-300 focus-within:border-[#0d6efd] focus-within:ring-3 focus-within:ring-[#0d6efd]/10"
        }`}
      >
        {icon && <span className="text-gray-400 shrink-0">{icon}</span>}

        <input
          type={type}
          placeholder={placeholder}
          {...(type !== "file" ? { value } : {})}
          onChange={(e) => {
            if (type === "file") {
              const file = e.target.files?.[0]
              if (file) {
                const reader = new FileReader()
                reader.onloadend = () => {
                  onChange(reader.result as string) // base64
                }
                reader.readAsDataURL(file)
              }
            } else {
              onChange(e.target.value)
            }
          }}
          className="flex-1 bg-transparent text-gray-700 text-sm placeholder-gray-400 outline-none"
        />
      </div>

      {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
    </div>
  )
}
/* ── Select field ───────────────────────────────────── */
function SelectField({
  placeholder, value, onChange, options, error, icon
}: {
  placeholder: string; value: string
  onChange: (v: string) => void; options: string[]; error?: string; icon?: React.ReactNode
}) {
  return (
    <div>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-white transition-all duration-200 ${
        error ? "border-red-300 bg-red-50/30" : "border-gray-200 hover:border-blue-300 focus-within:border-[#0d6efd] focus-within:ring-3 focus-within:ring-[#0d6efd]/10"
      }`}>
        {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none cursor-pointer appearance-none text-gray-700"
          style={{ color: value ? "#374151" : "#9ca3af" }}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <svg className="w-4 h-4 text-gray-400 shrink-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
    </div>
  )
}