"use client"

import {
  Home, User, UserPlus, GraduationCap, Users,
  Receipt, ClipboardList, Calendar, Wallet, LogOut, Menu, X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { clearToken } from "@/lib/api"

export type SectionType =
  | "dashboard"
  | "profile"
  | "registerUser"
  | "students"
  | "studentManagement"
  | "inquiryStudents"
  | "teachers"
  | "teacherManagement"
  | "teacherUpdates"
  | "invoices"
  | "inquiry"
  | "appointments"
  | "finance"

interface SidebarProps {
  activeSection: SectionType
  onSectionChange: (s: SectionType) => void
  expanded: boolean
  onExpandedChange: (v: boolean) => void
}

const menuItems: { id: SectionType; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard",    label: "Dashboard",    icon: <Home className="h-5 w-5" /> },
  { id: "profile",      label: "Admin Profile", icon: <User className="h-5 w-5" /> },
  { id: "registerUser", label: "Register User", icon: <UserPlus className="h-5 w-5" /> },
  { id: "students",     label: "Students",      icon: <GraduationCap className="h-5 w-5" /> },
  { id: "teachers",     label: "Teachers",      icon: <Users className="h-5 w-5" /> },
  { id: "invoices",     label: "Invoices",      icon: <Receipt className="h-5 w-5" /> },
  // { id: "inquiry",      label: "New Inquiry",   icon: <ClipboardList className="h-5 w-5" /> },
  { id: "appointments", label: "Appointments",  icon: <Calendar className="h-5 w-5" /> },
  { id: "finance",      label: "Finance",       icon: <Wallet className="h-5 w-5" /> },
]

export function Sidebar({
  activeSection,
  onSectionChange,
  expanded,
  onExpandedChange
}: SidebarProps) {

  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [teacherOpen, setTeacherOpen] = useState(false)
  const [studentOpen, setStudentOpen] = useState(false)

  const handleLogout = () => {
    clearToken()
    // localStorage.removeItem("adminInfo")
    localStorage.removeItem("userInfo")
    window.location.href = "/"
  }

  const Nav = ({ mobile = false }) => (
    <>
      {/* Logo */}
      <div className="flex flex-col items-center p-4 border-b border-slate-700">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-lg shrink-0">
          A
        </div>
        <span className={cn(
          "mt-2 text-amber-400 font-semibold text-sm text-center transition-all duration-300 overflow-hidden whitespace-nowrap",
          expanded || mobile ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
        )}>
         Absolute Foundation
        </span>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {menuItems.map(item => {

          // 👉 Teachers Dropdown
          if (item.id === "teachers") {
            return (
              <div key={item.id}>
                <button
                  onClick={() => setTeacherOpen(prev => !prev)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:bg-slate-700 transition-all duration-200"
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className={cn(
                    "whitespace-nowrap transition-all duration-300 overflow-hidden flex-1",
                    expanded || mobile ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                  )}>
                    {item.label}
                  </span>
                  {(expanded || mobile) && (
                    <span className="text-xs">{teacherOpen ? "▲" : "▼"}</span>
                  )}
                </button>

                {teacherOpen && (expanded || mobile) && (
                  <div className="ml-10 space-y-1">
                    <button
                      onClick={() => { onSectionChange("teacherManagement"); setMobileOpen(false) }}
                      className={cn(
                        "block w-full text-left px-3 py-2 text-sm hover:text-amber-400",
                        activeSection === "teacherManagement" ? "text-amber-400" : "text-slate-300"
                      )}
                    >
                      Teacher Management
                    </button>
                    <button
                      onClick={() => { onSectionChange("teacherUpdates"); setMobileOpen(false) }}
                      className={cn(
                        "block w-full text-left px-3 py-2 text-sm hover:text-amber-400",
                        activeSection === "teacherUpdates" ? "text-amber-400" : "text-slate-300"
                      )}
                    >
                      Teacher Updates
                    </button>
                  </div>
                )}
              </div>
            )
          }

          // 👉 Students Dropdown — Student Management + Inquiry Students
          if (item.id === "students") {
            const isStudentActive =
              activeSection === "studentManagement" || activeSection === "inquiryStudents"
            return (
              <div key={item.id}>
                <button
                  onClick={() => setStudentOpen(prev => !prev)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700 transition-all duration-200",
                    isStudentActive ? "text-amber-400" : "text-slate-300"
                  )}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className={cn(
                    "whitespace-nowrap transition-all duration-300 overflow-hidden flex-1",
                    expanded || mobile ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                  )}>
                    {item.label}
                  </span>
                  {(expanded || mobile) && (
                    <span className="text-xs">{studentOpen ? "▲" : "▼"}</span>
                  )}
                </button>

                {studentOpen && (expanded || mobile) && (
                  <div className="ml-10 space-y-1">
                    <button
                      onClick={() => { onSectionChange("studentManagement"); setMobileOpen(false) }}
                      className={cn(
                        "block w-full text-left px-3 py-2 text-sm hover:text-amber-400",
                        activeSection === "studentManagement" ? "text-amber-400" : "text-slate-300"
                      )}
                    >
                      Student Management
                    </button>
                    <button
                      onClick={() => { onSectionChange("inquiryStudents"); setMobileOpen(false) }}
                      className={cn(
                        "block w-full text-left px-3 py-2 text-sm hover:text-amber-400",
                        activeSection === "inquiryStudents" ? "text-amber-400" : "text-slate-300"
                      )}
                    >
                      Inquiry Students
                    </button>
                  </div>
                )}
              </div>
            )
          }

          // 👉 Normal Items (inquiry is now just a plain button — no dropdown)
          return (
            <button
              key={item.id}
              onClick={() => { onSectionChange(item.id); setMobileOpen(false) }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-slate-700 hover:translate-x-1",
                activeSection === item.id
                  ? "bg-slate-700 border-r-4 border-amber-400 text-amber-400"
                  : "text-slate-300"
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={cn(
                "whitespace-nowrap transition-all duration-300 overflow-hidden",
                expanded || mobile ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 text-white"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className={cn(
            "whitespace-nowrap transition-all duration-300 overflow-hidden",
            expanded || mobile ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
          )}>
            Logout
          </span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
        onClick={() => setMobileOpen(prev => !prev)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col transition-transform duration-300 lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Nav mobile />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        onMouseEnter={() => onExpandedChange(true)}
        onMouseLeave={() => onExpandedChange(false)}
        className={cn(
          "hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col bg-gradient-to-b from-slate-900 to-slate-950 transition-all duration-300 shadow-xl",
          expanded ? "w-56" : "w-16"
        )}
      >
        <Nav />
      </aside>
    </>
  )
}