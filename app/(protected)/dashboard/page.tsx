"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar, type SectionType }      from "@/components/dashboard/sidebar"
import { DashboardContent }               from "@/components/dashboard/dashboard-content"
import { ProfileContent }                 from "@/components/dashboard/profile-content"
import { RegisterUserContent }            from "@/components/dashboard/register-user-content"
import { StudentsContent }                from "@/components/dashboard/students-content"
import { TeachersContent }                from "@/components/dashboard/teachers-content"
import { InvoicesContent }                from "@/components/dashboard/invoices-content"
import { InquiryContent }                 from "@/components/dashboard/inquiry-content"
import { InquiryStudentsContent }         from "@/components/dashboard/InquiryStudentsContent"
import { AppointmentsContent }            from "@/components/dashboard/appointments-content"
import { FinanceContent }                 from "@/components/dashboard/finance-content"
import { TeacherUpdatesContent }          from "@/components/dashboard/teacher-updates"
import { getToken }                       from "@/lib/api"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const router = useRouter()
  const [activeSection,   setActiveSection]   = useState<SectionType>("dashboard")
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [authed,          setAuthed]          = useState<boolean | null>(null)

  // useEffect(() => { setAuthed(!!getToken()) }, [])
     useEffect(() => {
    const hasToken = !!getToken()
    if (!hasToken) {
      router.replace("/")
      return
    }

    const storedUser = localStorage.getItem("userInfo")
    let userRole: string | null = null
    if (storedUser) {
      try {
        userRole = JSON.parse(storedUser)?.role ?? null
      } catch {
        userRole = null
      }
    }
    if (userRole !== "admin") {
      router.replace("/teacherdashboard")
      return
    }

    setAuthed(true)
  }, [router])

  if (authed === null) return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":         return <DashboardContent />
      case "profile":           return <ProfileContent />
      case "registerUser":      return <RegisterUserContent />
      case "studentManagement": return <StudentsContent />
      case "inquiryStudents":   return <InquiryStudentsContent />
      case "teacherManagement": return <TeachersContent />
      case "teacherUpdates":    return <TeacherUpdatesContent />
      case "invoices":          return <InvoicesContent />
      case "inquiry":           return <InquiryContent />
      case "appointments":      return <AppointmentsContent />
      case "finance":           return <FinanceContent />
      default:                  return <DashboardContent />
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        expanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
      />
      <main className={cn(
        "flex-1 p-4 md:p-6 transition-all duration-300",
        sidebarExpanded ? "lg:ml-56" : "lg:ml-16"
      )}>
        {!authed && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
            ⚠️ You are not logged in. Some features may not work.
            <a href="/" className="underline ml-auto">Login</a>
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  )
}