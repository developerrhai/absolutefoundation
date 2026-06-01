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
import { Calendar, Plus, Edit2, Trash2, MessageCircle, Loader2 } from "lucide-react"
import { appointmentsApi } from "@/lib/api"

interface Appointment {
  id: number; name: string; standard: string; board: string; course: string
  appointment_date: string; appointment_time: string; location: string
  whatsapp: string; status: "Pending"|"Confirmed"|"Done"|"Cancelled"
}

const statusColor = (s: string) => ({
  Pending:"bg-yellow-100 text-yellow-700",Confirmed:"bg-blue-100 text-blue-700",
  Done:"bg-emerald-100 text-emerald-700",Cancelled:"bg-red-100 text-red-700",
}[s] || "bg-gray-100 text-gray-700")

const blank = { name:"", standard:"", board:"", course:"", date:"", time:"", location:"", whatsapp:"", status:"Pending" }

export function AppointmentsContent() {
  const [apts,           setApts]           = useState<Appointment[]>([])
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [filterLoc,      setFilterLoc]      = useState("all")
  const [filterDate,     setFilterDate]     = useState("all")
  const [modalOpen,      setModalOpen]      = useState(false)
  const [editing,        setEditing]        = useState<Appointment | null>(null)
  const [form,           setForm]           = useState<Record<string,string>>(blank)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res: any = await appointmentsApi.getAll({
        date_filter: filterDate !== "all" ? filterDate : undefined,
        location:    filterLoc  !== "all" ? filterLoc  : undefined,
      })
      setApts(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [filterDate, filterLoc])

  useEffect(() => { load() }, [load])

  const openAdd  = () => { setEditing(null); setForm(blank); setModalOpen(true) }
  const openEdit = (a: Appointment) => {
    setEditing(a)
    setForm({ name:a.name, standard:a.standard, board:a.board, course:a.course,
      date:a.appointment_date?.split("T")[0]||"", time:a.appointment_time?.slice(0,5)||"",
      location:a.location, whatsapp:a.whatsapp, status:a.status })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.date || !form.time) { alert("Name, date and time are required"); return }
    setSaving(true)
    try {
      if (editing) await appointmentsApi.update(editing.id, form)
      else         await appointmentsApi.create(form)
      setModalOpen(false); load()
    } catch (err: any) { alert(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this appointment?")) return
    try { await appointmentsApi.remove(id); load() }
    catch (err: any) { alert(err.message) }
  }

  const sendWhatsApp = (a: Appointment) => {
    const num = a.whatsapp.replace(/\D/g,"")
    const msg = `Hello ${a.name},\n\nYour appointment at Absolute Foundation:\nDate: ${a.appointment_date?.split("T")[0]}\nTime: ${a.appointment_time?.slice(0,5)}\nLocation: ${a.location}\n\nPlease confirm.\n\nThank you,\nAbsolute Foundation`
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`,"_blank")
  }

  const f = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <Calendar className="h-6 w-6" /> Student Appointments
          </CardTitle>
          <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Add Appointment
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Select value={filterLoc} onValueChange={setFilterLoc}>
              <SelectTrigger><SelectValue placeholder="All Locations" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="Chinchwad">Chinchwad</SelectItem>
                <SelectItem value="Wakad">Wakad</SelectItem>
                <SelectItem value="Thergaon">Thergaon</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDate} onValueChange={setFilterDate}>
              <SelectTrigger><SelectValue placeholder="All Dates" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="nextWeek">Next Week</SelectItem>
                <SelectItem value="lastWeek">Last Week</SelectItem>
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
                    {["Name","Std","Board","Course","Date","Time","Location","Status","Actions"].map((h,i) => (
                      <TableHead key={h} className={`text-white font-semibold ${i>0&&i<7?"hidden "+(i<3?"sm":"md")+":table-cell":""} ${h==="Actions"?"text-center":""}`}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apts.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No appointments found</TableCell></TableRow>
                  ) : apts.map(a => (
                    <TableRow key={a.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{a.standard}</TableCell>
                      <TableCell className="hidden md:table-cell">{a.board}</TableCell>
                      <TableCell className="hidden lg:table-cell">{a.course}</TableCell>
                      <TableCell>{a.appointment_date?.split("T")[0]}</TableCell>
                      <TableCell className="hidden sm:table-cell">{a.appointment_time?.slice(0,5)}</TableCell>
                      <TableCell className="hidden md:table-cell">{a.location}</TableCell>
                      <TableCell><Badge className={statusColor(a.status)}>{a.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {a.whatsapp && <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-emerald-600" onClick={() => sendWhatsApp(a)}><MessageCircle className="h-4 w-4" /></Button>}
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => openEdit(a)}><Edit2 className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4" /></Button>
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />{editing?"Edit":"Add"} Appointment</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label>Student Name *</Label><Input value={form.name} onChange={e=>f("name",e.target.value)} placeholder="Name" /></div>
            <div className="space-y-2"><Label>Standard</Label><Input value={form.standard} onChange={e=>f("standard",e.target.value)} placeholder="e.g. 10" /></div>
            <div className="space-y-2"><Label>Board</Label>
              <Select value={form.board} onValueChange={v=>f("board",v)}>
                <SelectTrigger><SelectValue placeholder="Board" /></SelectTrigger>
                <SelectContent><SelectItem value="CBSE">CBSE</SelectItem><SelectItem value="ICSE">ICSE</SelectItem><SelectItem value="State">State</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Course</Label><Input value={form.course} onChange={e=>f("course",e.target.value)} placeholder="Course" /></div>
            <div className="space-y-2"><Label>Date *</Label><Input type="date" value={form.date} onChange={e=>f("date",e.target.value)} /></div>
            <div className="space-y-2"><Label>Time *</Label><Input type="time" value={form.time} onChange={e=>f("time",e.target.value)} /></div>
            <div className="space-y-2"><Label>Location</Label>
              <Select value={form.location} onValueChange={v=>f("location",v)}>
                <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
                <SelectContent><SelectItem value="Chinchwad">Chinchwad</SelectItem><SelectItem value="Wakad">Wakad</SelectItem><SelectItem value="Thergaon">Thergaon</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e=>f("whatsapp",e.target.value)} placeholder="+91XXXXXXXXXX" /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Status</Label>
              <Select value={form.status} onValueChange={v=>f("status",v)}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>{["Pending","Confirmed","Done","Cancelled"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving&&<Loader2 className="h-4 w-4 mr-2 animate-spin"/>}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
