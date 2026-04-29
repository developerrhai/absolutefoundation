"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { UserPlus, User, Mail, Phone, Building, MapPin, GraduationCap, BookOpen, Loader2 } from "lucide-react"
import { studentsApi, teachersApi, staffApi } from "@/lib/api"

export function RegisterUserContent() {
  const [formData, setFormData] = useState({
    name:"", email:"", phone:"", role:"",
    standard:"", board:"", institute:"", location:"",
    father_name:"", father_phone:"", course:"", subjects:"",
    department:"", designation:"",
    fees: "10000"   // ✅ default fees
  })
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }))

  // ✅ Generate student ID
  const generateStudentId = (standard: string) => {
    const random = Math.floor(10 + Math.random() * 90) // 2-digit random
    return `MEPL6992${standard}${random}` // Example: MEPL69921234
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.role) {
      setMsg({ text: "Name, email and role are required", ok: false })
      return
    }
    setLoading(true); setMsg(null)

    try {
      if (formData.role === "student") {
        const studentId = generateStudentId(formData.standard) // generate ID

        await studentsApi.create({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          father_name: formData.father_name,
          father_phone: formData.father_phone,
          board: formData.board,
          standard: formData.standard,
          course: formData.course,
          location: formData.location,
          institute: formData.institute,
          fees: Number(formData.fees),
          student_id: studentId // send generated ID to backend
        })

        setMsg({
          text: `Student registered successfully! ID: ${studentId}`,
          ok: true
        })
      } else if (formData.role === "teacher") {
        await teachersApi.create({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          institute: formData.institute,
          location: formData.location,
          subjects: formData.subjects
            ? formData.subjects.split(",").map(s => s.trim())
            : [],
        })
        setMsg({ text: "Teacher registered successfully!", ok: true })
      } else if (formData.role === "staff") {
        await staffApi.create({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          institute: formData.institute,
          location: formData.location,
          department: formData.department,
          designation: formData.designation,
        })
        setMsg({ text: "Staff registered successfully!", ok: true })
      }

      // Reset form
      setFormData({
        name:"", email:"", phone:"", role:"",
        standard:"", board:"", institute:"", location:"",
        father_name:"", father_phone:"", course:"", subjects:"",
        department:"", designation:"",
        fees: "10000"
      })

    } catch (err: any) {
      setMsg({ text: err.message || "Registration failed", ok: false })
    } finally {
      setLoading(false)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-100 p-4">
      <Card className="w-full max-w-3xl shadow-2xl border-0 rounded-2xl backdrop-blur-lg bg-white/80">
        <CardHeader className="sticky top-0 z-10 bg-white/70 backdrop-blur-md rounded-t-2xl border-b">
          <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-gray-800">
            <UserPlus className="h-7 w-7 text-emerald-600" /> Register New User
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          {msg && (
            <div className={`p-3 rounded-lg text-sm ${msg.ok ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-red-100 text-red-700 border border-red-200"}`}>
              {msg.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><User className="h-4 w-4 text-emerald-500" /> Full Name *</Label>
              <Input value={formData.name} onChange={e => set("name", e.target.value)} placeholder="Full name" />
            </div>
            {/* Email */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Mail className="h-4 w-4 text-emerald-500" /> Email *</Label>
              <Input type="email" value={formData.email} onChange={e => set("email", e.target.value)} placeholder="Email address" />
            </div>
            {/* Phone */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-500" /> Phone</Label>
              <Input value={formData.phone} onChange={e => set("phone", e.target.value)} placeholder="Phone number" />
            </div>
            {/* Role */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><User className="h-4 w-4 text-emerald-500" /> Role *</Label>
              <Select value={formData.role} onValueChange={v => set("role", v)}>
                <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem> 
                </SelectContent>
              </Select>
            </div>

            {/* Staff-specific fields */}
            {formData.role === "staff" && (
              <>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={formData.department || ""} onChange={e => set("department", e.target.value)} placeholder="e.g. Administration" />
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input value={formData.designation || ""} onChange={e => set("designation", e.target.value)} placeholder="e.g. Clerk, Manager" />
                </div>
              </>
            )}

            {/* Student-specific fields */}
            {formData.role === "student" && (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><User className="h-4 w-4 text-emerald-500" /> Father Name</Label>
                  <Input value={formData.father_name} onChange={e => set("father_name", e.target.value)} placeholder="Father's name" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-500" /> Father Phone</Label>
                  <Input value={formData.father_phone} onChange={e => set("father_phone", e.target.value)} placeholder="Father's phone" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-emerald-500" /> Standard</Label>
                  <Select value={formData.standard} onValueChange={v => set("standard", v)}>
                    <SelectTrigger><SelectValue placeholder="Select Standard" /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i+1} value={String(i+1)}>{i+1}th Standard</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-emerald-500" /> Board</Label>
                  <Select value={formData.board} onValueChange={v => set("board", v)}>
                    <SelectTrigger><SelectValue placeholder="Select Board" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CBSE">CBSE</SelectItem>
                      <SelectItem value="ICSE">ICSE</SelectItem>
                      <SelectItem value="State">State Board</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-emerald-500" /> Course</Label>
                  <Input value={formData.course} onChange={e => set("course", e.target.value)} placeholder="e.g. Science Tuition" />
                </div>
                {/* Hidden Fees */}
                <Input type="hidden" value={formData.fees} />
              </>
            )}

            {/* Teacher-specific */}
            {formData.role === "teacher" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-emerald-500" /> Subjects (comma-separated)</Label>
                <Input value={formData.subjects} onChange={e => set("subjects", e.target.value)} placeholder="e.g. Math, Physics" />
              </div>
            )}

            {/* Common fields */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Building className="h-4 w-4 text-emerald-500" /> Institute Name</Label>
              <Input value={formData.institute} onChange={e => set("institute", e.target.value)} placeholder="Institute name" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-500" /> Location</Label>
              <Select value={formData.location} onValueChange={v => set("location", v)}>
                <SelectTrigger><SelectValue placeholder="Select Location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chinchwad">Chinchwad</SelectItem>
                  <SelectItem value="Wakad">Wakad</SelectItem>
                  <SelectItem value="Thergaon">Thergaon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={loading}
            className="w-full mt-6 py-3 text-lg bg-gradient-to-r from-emerald-500 to-emerald-700 hover:scale-[1.02] transition-all shadow-lg">
            {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <UserPlus className="h-5 w-5 mr-2" />}
            {loading ? "Registering…" : "Register User"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}