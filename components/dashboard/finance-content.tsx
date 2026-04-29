"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Wallet, Users, Receipt, TrendingUp, TrendingDown, Trash2, IndianRupee, Loader2, Pencil } from "lucide-react"
import { financeApi, teachersApi } from "@/lib/api"

interface FinanceRecord {
  id: number; type: "Payroll" | "Expense"; name: string
  amount: number; record_date: string; category: string
}
interface Summary { total_payroll: number; total_expense: number; grand_total: number }
interface Teacher  { id: number; name: string }

export function FinanceContent() {
  const [records,      setRecords]      = useState<FinanceRecord[]>([])
  const [summary,      setSummary]      = useState<Summary>({ total_payroll:0, total_expense:0, grand_total:0 })
  const [teachers,     setTeachers]     = useState<Teacher[]>([])
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState("report")
  const [timeFilter,   setTimeFilter]   = useState("thisMonth")
  const [fromDate,     setFromDate]     = useState("")
  const [toDate,       setToDate]       = useState("")

  // Payroll form
  const [pTeacher, setPTeacher] = useState("")
  const [pAmount,  setPAmount]  = useState("")
  const [pDate,    setPDate]    = useState("")
  const [pSaving,  setPSaving]  = useState(false)

  // Expense form
  const [eTitle,   setETitle]   = useState("")
  const [eType,    setEType]    = useState("")
  const [eAmount,  setEAmount]  = useState("")
  const [eDate,    setEDate]    = useState("")
  const [eSaving,  setESaving]  = useState(false)

  // Edit modal state
  const [editRecord,  setEditRecord]  = useState<FinanceRecord | null>(null)
  const [editName,    setEditName]    = useState("")
  const [editAmount,  setEditAmount]  = useState("")
  const [editDate,    setEditDate]    = useState("")
  const [editCategory,setEditCategory]= useState("")
  const [editSaving,  setEditSaving]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [recRes, sumRes]: any[] = await Promise.all([
        financeApi.getAll({ time_filter: timeFilter }),
        financeApi.summary(timeFilter),
      ])
      setRecords(recRes.data)
      setSummary(sumRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [timeFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    teachersApi.getAll().then((res: any) => setTeachers(res.data)).catch(console.error)
  }, [])

  const addPayroll = async () => {
    if (!pTeacher || !pAmount || !pDate) { alert("Fill all payroll fields"); return }
    setPSaving(true)
    try {
      await financeApi.create({ type:"Payroll", name:pTeacher, amount:parseFloat(pAmount), date:pDate, category:"Salary" })
      setPTeacher(""); setPAmount(""); setPDate("")
      load()
    } catch (err: any) { alert(err.message) }
    finally { setPSaving(false) }
  }

  const addExpense = async () => {
    if (!eTitle || !eAmount || !eDate) { alert("Fill all expense fields"); return }
    setESaving(true)
    try {
      await financeApi.create({ type:"Expense", name:eTitle, amount:parseFloat(eAmount), date:eDate, category:eType })
      setETitle(""); setEType(""); setEAmount(""); setEDate("")
      load()
    } catch (err: any) { alert(err.message) }
    finally { setESaving(false) }
  }

  const deleteRecord = async (id: number) => {
    if (!confirm("Delete this record?")) return
    try { await financeApi.remove(id); load() } catch (err: any) { alert(err.message) }
  }

  // Open the edit modal and pre-fill fields from the selected record
  const openEdit = (r: FinanceRecord) => {
    setEditRecord(r)
    setEditName(r.name)
    setEditAmount(String(r.amount))
    setEditDate(r.record_date?.split("T")[0] ?? "")
    setEditCategory(r.category)
  }

  const closeEdit = () => {
    setEditRecord(null)
    setEditName(""); setEditAmount(""); setEditDate(""); setEditCategory("")
  }

  const saveEdit = async () => {
    if (!editRecord) return
    if (!editName || !editAmount || !editDate) { alert("Fill all fields"); return }
    setEditSaving(true)
    try {
      await financeApi.update(editRecord.id, {
        name:     editName,
        amount:   parseFloat(editAmount),
        date:     editDate,
        category: editCategory,
      })
      closeEdit()
      load()
    } catch (err: any) { alert(err.message) }
    finally { setEditSaving(false) }
  }

  const filterLabel = () => ({
    thisMonth:"This Month", lastMonth:"Last Month", thisYear:"This Year", lastYear:"Previous Year"
  }[timeFilter] || "")

  const EXPENSE_TYPES = ["Rent","Electricity","Marketing","Stationary","Maintenance","Other"]

  const isWithinCustomRange = (recordDate: string) => {
    const day = recordDate?.split("T")[0] || ""
    if (!day) return false
    if (fromDate && day < fromDate) return false
    if (toDate && day > toDate) return false
    return true
  }

  const hasCustomDateFilter = Boolean(fromDate || toDate)
  const filteredRecords = hasCustomDateFilter
    ? records.filter((r) => isWithinCustomRange(r.record_date))
    : records

  const filteredSummary = hasCustomDateFilter
    ? filteredRecords.reduce(
        (acc, rec) => {
          const amount = Number(rec.amount || 0)
          if (rec.type === "Payroll") acc.total_payroll += amount
          else acc.total_expense += amount
          acc.grand_total += amount
          return acc
        },
        { total_payroll: 0, total_expense: 0, grand_total: 0 } as Summary
      )
    : summary

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      {/* ── Edit Dialog ──────────────────────────────────────── */}
      <Dialog open={!!editRecord} onOpenChange={(open) => { if (!open) closeEdit() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Edit {editRecord?.type} Record
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name — teacher dropdown for Payroll, free text for Expense */}
            <div className="space-y-2">
              <Label>{editRecord?.type === "Payroll" ? "Teacher" : "Expense Title"}</Label>
              {editRecord?.type === "Payroll" ? (
                <Select value={editName} onValueChange={setEditName}>
                  <SelectTrigger><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Title" />
              )}
            </div>

            {/* Category — only editable for Expense */}
            {editRecord?.type === "Expense" && (
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger><SelectValue placeholder="Expense Type" /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
                placeholder="Amount"
              />
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeEdit} disabled={editSaving}>
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              disabled={editSaving}
              className={editRecord?.type === "Payroll"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-amber-600 hover:bg-amber-700"}
            >
              {editSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <Wallet className="h-6 w-6" /> Finance Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="payroll"  className="flex items-center gap-2"><Users      className="h-4 w-4"/><span className="hidden sm:inline">Payroll</span></TabsTrigger>
              <TabsTrigger value="expense"  className="flex items-center gap-2"><Receipt    className="h-4 w-4"/><span className="hidden sm:inline">Expense</span></TabsTrigger>
              <TabsTrigger value="report"   className="flex items-center gap-2"><TrendingUp className="h-4 w-4"/><span className="hidden sm:inline">Report</span></TabsTrigger>
            </TabsList>

            {/* ── Payroll Tab ───────────────────────────────────── */}
            <TabsContent value="payroll" className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Users className="h-5 w-5"/>Add Teacher Payroll</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Teacher</Label>
                    <Select value={pTeacher} onValueChange={setPTeacher}>
                      <SelectTrigger><SelectValue placeholder="Select Teacher"/></SelectTrigger>
                      <SelectContent>
                        {teachers.length > 0
                          ? teachers.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)
                          : <SelectItem value="_none" disabled>No teachers found</SelectItem>
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input type="number" value={pAmount} onChange={e => setPAmount(e.target.value)} placeholder="Salary amount"/>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={pDate} onChange={e => setPDate(e.target.value)}/>
                  </div>
                </div>
                <Button onClick={addPayroll} disabled={pSaving} className="mt-4 bg-blue-600 hover:bg-blue-700">
                  {pSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}Add Payroll
                </Button>
              </div>
            </TabsContent>

            {/* ── Expense Tab ───────────────────────────────────── */}
            <TabsContent value="expense" className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Receipt className="h-5 w-5"/>Add Expense</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Expense Title</Label>
                    <Input value={eTitle} onChange={e => setETitle(e.target.value)} placeholder="Title"/>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={eType} onValueChange={setEType}>
                      <SelectTrigger><SelectValue placeholder="Expense Type"/></SelectTrigger>
                      <SelectContent>
                        {EXPENSE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input type="number" value={eAmount} onChange={e => setEAmount(e.target.value)} placeholder="Amount"/>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={eDate} onChange={e => setEDate(e.target.value)}/>
                  </div>
                </div>
                <Button onClick={addExpense} disabled={eSaving} className="mt-4 bg-amber-600 hover:bg-amber-700">
                  {eSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}Add Expense
                </Button>
              </div>
            </TabsContent>

            {/* ── Report Tab ────────────────────────────────────── */}
            <TabsContent value="report" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filter by time"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                    <SelectItem value="thisYear">This Year</SelectItem>
                    <SelectItem value="lastYear">Previous Year</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full sm:w-[170px]"
                  />
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full sm:w-[170px]"
                  />
                  {(fromDate || toDate) && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setFromDate("")
                        setToDate("")
                      }}
                      className="w-full sm:w-auto"
                    >
                      Clear Dates
                    </Button>
                  )}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600">Total Payroll</p>
                        <p className="text-2xl font-bold text-blue-700">₹{Number(filteredSummary.total_payroll||0).toLocaleString()}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-500"/>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-amber-600">Total Expense</p>
                        <p className="text-2xl font-bold text-amber-700">₹{Number(filteredSummary.total_expense||0).toLocaleString()}</p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-amber-500"/>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-emerald-600">Grand Total</p>
                        <p className="text-2xl font-bold text-emerald-700">₹{Number(filteredSummary.grand_total||0).toLocaleString()}</p>
                      </div>
                      <IndianRupee className="h-8 w-8 text-emerald-500"/>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Records Table */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{filterLabel()} Records</h3>
              {activeTab !== "report" && (
                <div className="flex items-center gap-2">
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-[160px]"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thisMonth">This Month</SelectItem>
                      <SelectItem value="lastMonth">Last Month</SelectItem>
                      <SelectItem value="thisYear">This Year</SelectItem>
                      <SelectItem value="lastYear">Previous Year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-[150px]"
                  />
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-[150px]"
                  />
                  {(fromDate || toDate) && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setFromDate("")
                        setToDate("")
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-900">
                      <TableHead className="text-white font-semibold">Type</TableHead>
                      <TableHead className="text-white font-semibold">Name</TableHead>
                      <TableHead className="text-white font-semibold hidden sm:table-cell">Category</TableHead>
                      <TableHead className="text-white font-semibold">Amount</TableHead>
                      <TableHead className="text-white font-semibold hidden sm:table-cell">Date</TableHead>
                      <TableHead className="text-white font-semibold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
                    ) : filteredRecords.map(r => (
                      <TableRow key={r.id} className="hover:bg-muted/50">
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-sm font-medium ${r.type==="Payroll"?"bg-blue-100 text-blue-700":"bg-amber-100 text-amber-700"}`}>
                            {r.type}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{r.category}</TableCell>
                        <TableCell>₹{Number(r.amount).toLocaleString()}</TableCell>
                        <TableCell className="hidden sm:table-cell">{r.record_date?.split("T")[0]}</TableCell>
                        <TableCell>
                          <div className="flex justify-center items-center gap-2">
                            {/* Edit button */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
                              onClick={() => openEdit(r)}
                              title="Edit record"
                            >
                              <Pencil className="h-3.5 w-3.5 text-slate-600" />
                            </Button>
                            {/* Delete button */}
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 w-8 p-0"
                              onClick={() => deleteRecord(r.id)}
                              title="Delete record"
                            >
                              <Trash2 className="h-4 w-4"/>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}