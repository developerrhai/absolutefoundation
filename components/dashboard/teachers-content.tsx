"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
// import { Users, Eye, Trash2, Phone, User, Mail, MapPin, Building, Loader2 } from "lucide-react"
import { Users, Eye, Trash2, Phone, User, Mail, MapPin, Building, Loader2, FileSpreadsheet } from "lucide-react"
import { teachersApi } from "@/lib/api"

interface Teacher {
  id: number; name: string; email: string; phone: string
 subjects: string[]
}

export function TeachersContent() {
  const [teachers, setTeachers]   = useState<Teacher[]>([])
  const [loading,  setLoading]    = useState(true)
  const [selected, setSelected]   = useState<Teacher | null>(null)
  const [viewOpen, setViewOpen]   = useState(false)

  useEffect(() => {
    teachersApi.getAll().then((res: any) => setTeachers(res.data))
      .catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this teacher?")) return
    try {
      await teachersApi.remove(id)
      setTeachers(prev => prev.filter(t => t.id !== id))
    } catch (err: any) { alert(err.message) }
  }


   const handleExportExcel = () => {
    if (!teachers.length) {
      alert("No teachers to export")
      return
    }

    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      // "Institute",
      // "Location",
      "Subjects",
    ]

    const rows = teachers.map((t) => [
      t.id,
      t.name || "",
      t.email || "",
      t.phone || "",
      // t.institute || "",
      // t.location || "",
      (t.subjects || []).join(", "),
    ])

    const esc = (value: string | number) => `"${String(value).replace(/"/g, "\"\"")}"`
    const csv = [headers, ...rows].map((row) => row.map(esc).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `teachers_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <Card>
        {/* <CardHeader> */}
             <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <Users className="h-6 w-6" /> Teacher Management
          </CardTitle>
              <Button onClick={handleExportExcel} variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-900">
                    <TableHead className="text-white font-semibold">Name</TableHead>
                    <TableHead className="text-white font-semibold hidden sm:table-cell">Email</TableHead>
                    <TableHead className="text-white font-semibold hidden md:table-cell">Phone</TableHead>
                    {/* <TableHead className="text-white font-semibold hidden lg:table-cell">Institute</TableHead> */}
                    <TableHead className="text-white font-semibold">Subjects</TableHead>
                    <TableHead className="text-white font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No teachers found</TableCell></TableRow>
                  ) : teachers.map(t => (
                    <TableRow key={t.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{t.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{t.phone}</TableCell>
                      <TableCell className="hidden lg:table-cell">{t.subjects}</TableCell>
                      {/* <TableCell>{t.location}</TableCell> */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                            onClick={() => { setSelected(t); setViewOpen(true) }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" className="h-8 w-8 p-0"
                            onClick={() => handleDelete(t.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Teacher Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                  {selected.name.charAt(0)}
                </div>
              </div>
              {[
                { icon: User,     label: "Name",      value: selected.name },
                { icon: Mail,     label: "Email",     value: selected.email },
                { icon: Phone,    label: "Phone",     value: selected.phone },
                // { icon: Building, label: "Institute", value: selected.institute },
                { icon: Building,   label: "Subjects",  value: selected.subjects?.join(", ") },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div><p className="text-sm text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>
                </div>
              ))}
              {selected.subjects?.length > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.subjects.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
