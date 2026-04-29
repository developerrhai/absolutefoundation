"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, Plus, Edit2, Trash2, Video, Loader2 } from "lucide-react"
import { inquiriesApi } from "@/lib/api"

interface Inquiry {
  id: number; name: string; phone: string; father_name: string; father_phone: string
  course: string; location: string; board: string; standard: string
  status: string; video: string; inquiry_date: string
}

const statusColors: Record<string, string> = {
  "New":            "bg-blue-100 text-blue-700 border-blue-200",
  "Contacted":      "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Follow Up":      "bg-purple-100 text-purple-700 border-purple-200",
  "Admission Done": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Not Interested": "bg-red-100 text-red-700 border-red-200",
}

const blank = { name:"", phone:"", father_name:"", father_phone:"", course:"", location:"", board:"", standard:"", status:"New", video:"" }

export function InquiryContent() {
  const [inquiries,       setInquiries]       = useState<Inquiry[]>([])
  const [loading,         setLoading]         = useState(true)
  const [saving,          setSaving]          = useState(false)
  const [filterDate,      setFilterDate]      = useState("all")
  const [filterLocation,  setFilterLocation]  = useState("all")
  const [filterStandard,  setFilterStandard]  = useState("all")
  const [modalOpen,       setModalOpen]       = useState(false)
  const [editing,         setEditing]         = useState<Inquiry | null>(null)
  const [form,            setForm]            = useState<Record<string, string>>(blank)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res: any = await inquiriesApi.getAll({
        date_filter: filterDate     !== "all" ? filterDate     : undefined,
        location:    filterLocation !== "all" ? filterLocation : undefined,
        standard:    filterStandard !== "all" ? filterStandard : undefined,
      })
      setInquiries(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [filterDate, filterLocation, filterStandard])

  useEffect(() => { load() }, [load])

  const openAdd  = () => { setEditing(null); setForm(blank); setModalOpen(true) }
  const openEdit = (inq: Inquiry) => {
    setEditing(inq)
    setForm({ name:inq.name, phone:inq.phone, father_name:inq.father_name, father_phone:inq.father_phone,
      course:inq.course, location:inq.location, board:inq.board, standard:inq.standard, status:inq.status, video:inq.video })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.phone) { alert("Name and phone are required"); return }
    setSaving(true)
    try {
      if (editing) {
        await inquiriesApi.update(editing.id, form)
      } else {
        await inquiriesApi.create(form)
      }
      setModalOpen(false)
      load()
    } catch (err: any) { alert(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this inquiry?")) return
    try { await inquiriesApi.remove(id); load() }
    catch (err: any) { alert(err.message) }
  }

  const f = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <ClipboardList className="h-6 w-6" /> New Student Inquiry
          </CardTitle>
          <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> New Inquiry
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Select value={filterDate} onValueChange={setFilterDate}>
              <SelectTrigger><SelectValue placeholder="All Dates" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7">Last 7 Days</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger><SelectValue placeholder="All Locations" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="Chinchwad">Chinchwad</SelectItem>
                <SelectItem value="Wakad">Wakad</SelectItem>
                <SelectItem value="Thergaon">Thergaon</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStandard} onValueChange={setFilterStandard}>
              <SelectTrigger><SelectValue placeholder="All Standards" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Standards</SelectItem>
                {Array.from({length:12},(_,i)=>(
                  <SelectItem key={i+1} value={String(i+1)}>{i+1}th Standard</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-900">
                    <TableHead className="text-white font-semibold">Name</TableHead>
                    <TableHead className="text-white font-semibold hidden sm:table-cell">Phone</TableHead>
                    <TableHead className="text-white font-semibold hidden md:table-cell">Course</TableHead>
                    <TableHead className="text-white font-semibold hidden lg:table-cell">Location</TableHead>
                    <TableHead className="text-white font-semibold">Std</TableHead>
                    <TableHead className="text-white font-semibold">Status</TableHead>
                    <TableHead className="text-white font-semibold hidden sm:table-cell">Video</TableHead>
                    <TableHead className="text-white font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiries.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No inquiries found</TableCell></TableRow>
                  ) : inquiries.map(inq => (
                    <TableRow key={inq.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{inq.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{inq.phone}</TableCell>
                      <TableCell className="hidden md:table-cell">{inq.course}</TableCell>
                      <TableCell className="hidden lg:table-cell">{inq.location}</TableCell>
                      <TableCell>{inq.standard}</TableCell>
                      <TableCell><Badge className={statusColors[inq.status] || "bg-gray-100 text-gray-700"}>{inq.status}</Badge></TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {inq.video && <a href={inq.video} target="_blank" rel="noopener noreferrer" className="text-blue-600"><Video className="h-4 w-4" /></a>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => openEdit(inq)}><Edit2 className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={() => handleDelete(inq.id)}><Trash2 className="h-4 w-4" /></Button>
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

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Inquiry" : "New Inquiry"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {[
              { key:"name",         label:"Student Name *", ph:"Name" },
              { key:"phone",        label:"Phone *",        ph:"Phone" },
              { key:"father_name",  label:"Father Name",    ph:"Father name" },
              { key:"father_phone", label:"Father Phone",   ph:"Father phone" },
              { key:"course",       label:"Course",         ph:"Course" },
              { key:"video",        label:"Video URL",      ph:"https://…" },
            ].map(({ key, label, ph }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input value={form[key]} onChange={e => f(key, e.target.value)} placeholder={ph} />
              </div>
            ))}
            {[
              { key:"location", label:"Location", items:["Chinchwad","Wakad","Thergaon"] },
              { key:"board",    label:"Board",    items:["CBSE","ICSE","State"] },
              { key:"standard", label:"Standard", items: Array.from({length:12},(_,i)=>String(i+1)) },
              { key:"status",   label:"Status",   items:["New","Contacted","Follow Up","Admission Done","Not Interested"] },
            ].map(({ key, label, items }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Select value={form[key]} onValueChange={v => f(key, v)}>
                  <SelectTrigger><SelectValue placeholder={`Select ${label}`} /></SelectTrigger>
                  <SelectContent>{items.map(it => <SelectItem key={it} value={it}>{it}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Update" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
