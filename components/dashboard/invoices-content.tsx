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
import { Receipt, Plus, Eye, Printer, Trash2, CheckCircle, Clock, AlertCircle, Loader2, Search, X, Edit2, FileSpreadsheet, MessageCircle } from "lucide-react"
import { invoicesApi, studentsApi } from "@/lib/api"

interface Invoice {
  id: number
  student_name: string
  amount: number
  paid_amount: number
  due_date?: string
  course?: string
  student_id?: string
  standard?: string
  install_date?: string
  description?: string
  transaction_type?: string
  student_phone?: string
}

interface Student {
  id: number
  name: string
  phone: string
  standard: string
  course: string
  location: string
  fee: number
  paid_fee: number
  father_name: string
}

interface Summary { total_invoiced: number; total_paid: number; total_pending: number }

type InvoiceStatus = "Paid" | "Partial" | "Pending" | "Overdue"

const getStatus = (inv: Invoice): InvoiceStatus => {
  const amount = Number(inv.amount)
  const paid = Number(inv.paid_amount)
  if (paid >= amount) return "Paid"
  if (paid > 0) return "Partial"
  if (inv.due_date && new Date(inv.due_date) < new Date()) return "Overdue"
  return "Pending"
}

const statusColor = (s: string) => ({
  Paid: "bg-emerald-100 text-emerald-700",
  Partial: "bg-yellow-100 text-yellow-700",
  Pending: "bg-blue-100 text-blue-700",
  Overdue: "bg-red-100 text-red-700",
}[s] ?? "bg-gray-100 text-gray-700")

const statusIcon = (s: string) => ({
  Paid: <CheckCircle className="h-4 w-4" />,
  Partial: <Clock className="h-4 w-4" />,
  Pending: <Clock className="h-4 w-4" />,
  Overdue: <AlertCircle className="h-4 w-4" />,
}[s] ?? null)

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString() : "—"

export function InvoicesContent() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [summary, setSummary] = useState<Summary>({ total_invoiced: 0, total_paid: 0, total_pending: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [studentFilter, setStudentFilter] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [editing, setEditing] = useState<Invoice | null>(null)

  const [students, setStudents] = useState<Student[]>([])
  const [studentSearch, setStudentSearch] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentsLoading, setStudentsLoading] = useState(false)

  const [form, setForm] = useState({
    student_name: "",
    amount: "",
    paid_amount: "",
    due_date: "",
    install_date: "",
    transaction_type: "Cash",
    description: "",
    student_id: "",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [invRes, sumRes]: any[] = await Promise.all([
        invoicesApi.getAll({ status: filterStatus !== "all" ? filterStatus : undefined }),
        invoicesApi.summary(),
      ])
      setInvoices(invRes.data)
      setSummary(sumRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [filterStatus])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!studentSearch.trim() || studentSearch.length < 1) {
      setStudents([])
      setShowDropdown(false)
      return
    }
    const timer = setTimeout(async () => {
      setStudentsLoading(true)
      try {
        const res: any = await studentsApi.getAll({ search: studentSearch })
        setStudents(res.data || [])
        setShowDropdown(true)
      } catch {
        setStudents([])
      } finally {
        setStudentsLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [studentSearch])

  const pickStudent = (s: Student) => {
    setSelectedStudent(s)
    setStudentSearch(s.name)
    setShowDropdown(false)
    const remaining = Number(s.fee) - Number(s.paid_fee)
    setForm(prev => ({
      ...prev,
      student_name: s.name,
      student_id: String(s.id),
      amount: remaining > 0 ? String(remaining) : String(s.fee),
      paid_amount: "0",
      description: `Tuition Fee – ${s.course || s.standard + "th Std"}`,
    }))
  }

  const clearStudent = () => {
    setSelectedStudent(null)
    setStudentSearch("")
    setStudents([])
    setShowDropdown(false)
    setForm(prev => ({
      ...prev,
      student_name: "", student_id: "", amount: "",
      paid_amount: "", description: "",
    }))
  }

  const openModal = () => {
    setEditing(null)
    clearStudent()
    setForm({
      student_name: "", amount: "", paid_amount: "",
      due_date: "", install_date: "", transaction_type: "Cash",
      description: "", student_id: "",
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.student_name || !form.amount || !form.due_date) {
      alert("Fill required fields"); return
    }
    setSaving(true)
    try {
      const payload = {
        student_name: form.student_name,
        student_id: form.student_id || undefined,
        amount: parseFloat(form.amount),
        paid_amount: parseFloat(form.paid_amount) || 0,
        due_date: form.due_date,
        install_date: form.install_date || undefined,
        transaction_type: form.transaction_type,
        description: form.description,
      }

      if (editing) {
        await invoicesApi.update(editing.id, payload)
      } else {
        await invoicesApi.create(payload)
      }
      setModalOpen(false)
      setEditing(null)
      load()
    } catch (err: any) { alert(err.message) }
    finally { setSaving(false) }
  }

  const openEdit = (inv: Invoice) => {
    setEditing(inv)
    setSelectedStudent({
      id: Number(inv.student_id || 0),
      name: inv.student_name || "",
      phone: "",
      standard: inv.standard || "",
      course: inv.course || "",
      location: "",
      fee: Number(inv.amount || 0),
      paid_fee: Number(inv.paid_amount || 0),
      father_name: "",
    })
    setStudentSearch(inv.student_name || "")
    setShowDropdown(false)
    setForm({
      student_name: inv.student_name || "",
      student_id: inv.student_id || "",
      amount: String(inv.amount ?? ""),
      paid_amount: String(inv.paid_amount ?? 0),
      due_date: inv.due_date ? new Date(inv.due_date).toISOString().split("T")[0] : "",
      install_date: inv.install_date ? new Date(inv.install_date).toISOString().split("T")[0] : "",
      transaction_type: inv.transaction_type || "Cash",
      description: inv.description || "",
    })
    setModalOpen(true)
  }

  const handleExportExcel = () => {
    if (!invoices.length) {
      alert("No invoices to export")
      return
    }

    const headers = [
      "Invoice ID",
      "Student Name",
      "Student ID",
      "Amount",
      "Paid Amount",
      "Balance",
      "Install Date",
      "Due Date",
      "Transaction Type",
      "Status",
      "Description",
    ]

    const rows = invoices.map((inv) => {
      const amount = Number(inv.amount || 0)
      const paid = Number(inv.paid_amount || 0)
      const balance = amount - paid
      return [
        `INV${String(inv.id).padStart(3, "0")}`,
        inv.student_name || "",
        inv.student_id || "",
        amount,
        paid,
        balance,
        inv.install_date ? new Date(inv.install_date).toLocaleDateString("en-CA") : "",
        inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-CA") : "",
        inv.transaction_type || "",
        getStatus(inv),
        inv.description || "",
      ]
    })

    const esc = (value: string | number) => `"${String(value).replace(/"/g, "\"\"")}"`
    const csv = [headers, ...rows].map((row) => row.map(esc).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoices_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this invoice?")) return
    try { await invoicesApi.remove(id); load() } catch (err: any) { alert(err.message) }
  }

  const handlePrint = (inv: Invoice) => {
    const w = window.open("", "_blank")
    if (!w) return
    const balance = Number(inv.amount) - Number(inv.paid_amount)
   w.document.write(
      `
      <html>
<head>
<title>Receipt #${inv.id}</title>

<style>

@page{
  size:A4;
  margin:25mm;
}

body{
  font-family: Arial, Helvetica, sans-serif;
  color:#333;
  margin:0;
}

.container{
  width:100%;
}

.header{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
}

.institute{
  line-height:1.4;
}

.institute h2{
  margin:0;
  font-size:20px;
  letter-spacing:0.5px;
}

.institute p{
  margin:2px 0;
  font-size:13px;
}

.logo{
  width:70px;
}

.title{
  text-align:center;
  font-size:22px;
  color:#1f7fa6;
  font-weight:bold;
  margin-top:15px;
  padding-top:10px;
  border-top:2px solid #1f7fa6;
}

.content{
  display:flex;
  justify-content:space-between;
  margin-top:25px;
}

.left{
  width:48%;
}

.right{
  width:48%;
}

.label{
  font-weight:bold;
  margin-top:10px;
}

.text{
  margin-top:4px;
}

.receipt-details{
  text-align:right;
  font-size:14px;
  margin-bottom:15px;
}

.table{
  width:100%;
  border-collapse:collapse;
}

.table td{
  padding:6px 0;
  font-size:14px;
}

.table td:last-child{
  text-align:right;
  font-weight:bold;
}

.balance{
  border-top:1px solid #999;
  padding-top:6px;
}

.signature{
  margin-top:70px;
  text-align:right;
}

.signature img{
  height:40px;
}

.auth{
  font-weight:bold;
  margin-top:6px;
}

</style>

</head>

<body>

<div class="container">

<div class="header">

<div class="institute">
<h2>DNYANSAGAR CLASSES</h2>
<p>201/A, New Excelsior Building Opp. Crown Hotel, KHADKI Pune - 411003 </p>
<p>Phone no : 8862010906</p>

<p>State: Maharashtra</p>
</div>

<img class="logo" src="/logo.jpeg" />

</div>

<div class="title">Payment Receipt</div>

<div class="content">

<div class="left">

<div class="label">Received From</div>
<div class="text">${inv.student_name}</div>

<div class="text">Contact No : ${inv.student_phone || "-"}</div>

<div class="label">Amount in words</div>
<div class="text">${Number(inv.paid_amount).toLocaleString()} Rupees only</div>

</div>

<div class="right">

<div class="receipt-details">
<div><b>Receipt Details</b></div>

<div>Receipt No : ${inv.id}</div>
<div><b>Date :</b> ${fmtDate(inv.install_date)}</div>
</div>

<table class="table">

<tr>
<td>Received</td>
<td>₹ ${Number(inv.paid_amount).toLocaleString()}</td>
</tr>

<tr>
<td>Payment mode</td>
<td>${inv.transaction_type || "Online"}</td>
</tr>

<tr>
<td>Previous Balance</td>
<td>₹ ${Number(inv.amount).toLocaleString()}</td>
</tr>

<tr class="balance">
<td>Current Balance</td>
<td>₹ ${balance}</td>
</tr>

</table>

</div>

</div>

<div class="signature">

<div>For : DNYANSAGAR CLASSES</div>

<img src="SIGNATURE_IMAGE_URL"/>

<div class="auth">Authorized Signatory</div>

</div>

</div>

</body>
</html>
`
    )
    w.document.close()
    w.print()
  }



    const handleInvoicePrint = (inv: Invoice | null) => {
    const w = window.open("", "_blank")
    if (!w) return
    const balance = Number(inv?.amount) - Number(inv?.paid_amount)
   w.document.write(`
<html>
<head>
<title>Invoice #${inv?.id}</title>

<style>

@page{
  size:A4;
  margin:20mm;
}

body{
  font-family: Arial, Helvetica, sans-serif;
  margin:0;
  color:#333;
}

.container{
  width:100%;
}

.header{
  display:flex;
  justify-content:space-between;
  border-bottom:2px solid #1f7fa6;
  padding-bottom:10px;
}

.institute h2{
  margin:0;
  font-size:20px;
}

.institute p{
  margin:2px 0;
  font-size:13px;
}

.logo{
  width:70px;
}

.title{
  text-align:center;
  color:#1f7fa6;
  font-size:22px;
  font-weight:bold;
  margin:15px 0;
}

.top{
  display:flex;
  justify-content:space-between;
  margin-top:10px;
}

.bill{
  font-size:14px;
}

.invoice-details{
  
}

.table{
  width:100%;
  border-collapse:collapse;
  margin-top:15px;
}

.table th{

  padding:8px;
  font-size:14px;
}

.table td{
  border-bottom:1px solid #ddd;
  padding:8px;
  font-size:14px;
}

.table td:last-child,
.table th:last-child{
  text-align:right;
}

.summary{
  display:flex;
  justify-content:space-between;
  margin-top:20px;
}

.left-summary{
  width:55%;
  font-size:14px;
}

.right-summary{
  width:40%;
}

.right-summary table{
  width:100%;
  font-size:14px;
}

.right-summary td{
  padding:6px 0;
}

.right-summary td:last-child{
  text-align:right;
}

.total{
 
  font-weight:bold;
  padding:6px;
}

.footer{
  display:flex;
  justify-content:space-between;
  margin-top:40px;
}

.bank{
  font-size:13px;
}

.qr{
  width:90px;
}

.signature{
  text-align:right;
}

.signature img{
  height:40px;
}

.auth{
  font-weight:bold;
  margin-top:5px;
}

</style>
</head>

<body>

<div class="container">

<div class="header">

<div class="institute">
<h2>DNYANSAGAR CLASSES</h2>
<p>201/A, New Excelsior Building Opp. Crown Hotel, KHADKI Pune - 411003</p>
<p>Phone : 8862010906</p>
<p>State : Maharashtra</p>
</div>

<img class="logo" src="${window.location.origin}/logo.jpeg"/>

</div>

<div class="title">Tax Invoice</div>

<div class="top">



<div class="invoice-details">

<p><b>Invoice No :</b>  ${inv?.id}</p>
<p><b>Date : </b> ${fmtDate(inv?.install_date)}</p>
</div>

</div>
 
        <div class="section-title">BILL TO</div>
        <p><b>Name:</b> ${inv?.student_name}</p>
        <p><b>Student ID:</b> ${inv?.student_id || "-"}</p>
        <p><b>Standard:</b> ${inv?.standard || "-"}</p>
        <p><b>Course:</b> ${inv?.course || "-"}</p>
<table class="table">
          <thead>
            <tr>
              <th>Description</th><th>Course</th><th>Transaction</th>
              <th>Install Date</th><th>Due Date</th><th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${inv?.description || "Course Fee"}</td>
              <td>${inv?.course || "-"}</td>
              <td>${inv?.transaction_type || "Cash"}</td>
              <td>${fmtDate(inv?.install_date)}</td>
              <td>${fmtDate(inv?.due_date)}</td>
              <td>₹${Number(inv?.amount).toLocaleString()}</td>
            </tr>
            <tr class="total">
              <td colspan="5">TOTAL</td>
              <td>₹${Number(inv?.amount).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

<div class="summary">

<div class="left-summary">

<b>Invoice Amount In Words</b><br/>
${Number(inv?.amount).toLocaleString()} Rupees only

<br/><br/>

<b>Terms and Conditions</b><br/>
FEES ONCE PAID WILL NOT BE REFUNDED IN ANY CASES<br/>
Thank You!<br/>
DNYANSAGAR CLASSES

</div>

<div class="right-summary">

<table>

<tr>
<td>Sub Total</td>
<td>₹ ${Number(inv?.amount).toLocaleString()}</td>
</tr>

<tr class="total">
<td>Total</td>
<td>₹ </td>
</tr>

<tr>
<td>Received</td>
<td>₹ </td>
</tr>

<tr>
<td>Balance</td>
<td>₹ </td>
</tr>

<tr>
<td>Payment mode</td>
<td>${inv?.transaction_type || "Online"}</td>
</tr>

</table>

</div>

</div>

<div class="footer">

<div class="bank">

<img class="qr" src="${window.location.origin}/qr.png"/><br/>

<b>Pay To:</b><br/>
Bank Name : HDFC BANK<br/>
Account No : 50200066917533<br/>
IFSC : HDFC0001791<br/>
Account Name : Vidyaaniketan Professional Academy

</div>

<div class="signature">

<div>For : Vidyaaniketan Professional Academy</div>

<img src="${window.location.origin}/sign.jpeg"/>

<div class="auth">Authorized Signatory</div>

</div>

</div>

</div>

</body>
</html>
`)
    w.document.close()
    w.print()
  }

  const handleWhatsAppShare = (inv: Invoice) => {
    const invoiceNo = `INV${String(inv.id).padStart(3, "0")}`
    const amount = Number(inv.amount || 0)
    const paid = Number(inv.paid_amount || 0)
    const balance = amount - paid
    const message = [
      "Hello,",
      "",
      `Invoice: ${invoiceNo}`,
      `Student: ${inv.student_name || "-"}`,
      `Course: ${inv.course || "-"}`,
      `Due Date: ${fmtDate(inv.due_date)}`,
      `Total Amount: Rs ${amount.toLocaleString()}`,
      `Paid Amount: Rs ${paid.toLocaleString()}`,
      `Balance: Rs ${balance.toLocaleString()}`,
      "",
      "Please find your invoice details above.",
    ].join("\n")

    const phone = ""
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const filteredInvoices = invoices.filter((inv) =>
    inv.student_name?.toLowerCase().includes(studentFilter.trim().toLowerCase())
  )

  return (
    <div className="space-y-6 pt-12 lg:pt-0">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Invoiced", value: summary.total_invoiced, cls: "from-blue-500 to-blue-600" },
          { label: "Total Collected", value: summary.total_paid, cls: "from-emerald-500 to-emerald-600" },
          { label: "Pending Amount", value: summary.total_pending, cls: "from-amber-500 to-amber-600" },
        ].map(({ label, value, cls }) => (
          <Card key={label} className={`bg-gradient-to-br ${cls} text-white border-0`}>
            <CardContent className="p-4">
              <p className="text-sm opacity-90">{label}</p>
              <p className="text-2xl font-bold">₹{Number(value || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <Receipt className="h-6 w-6" /> Invoices
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                placeholder="Search student name..."
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                {["all", "Paid", "Partial", "Pending", "Overdue"].map(s => (
                  <SelectItem key={s} value={s}>{s === "all" ? "All Status" : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleExportExcel} variant="outline">
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Export Excel
            </Button>
            <Button onClick={openModal} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> New Invoice
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-900">
                    <TableHead className="text-white font-semibold">ID</TableHead>
                    <TableHead className="text-white font-semibold">Student</TableHead>
                    <TableHead className="text-white font-semibold hidden sm:table-cell">Amount</TableHead>
                    <TableHead className="text-white font-semibold hidden md:table-cell">Paid</TableHead>
                    {/* ── NEW column ── */}
                    <TableHead className="text-white font-semibold hidden lg:table-cell">Install Date</TableHead>
                    <TableHead className="text-white font-semibold hidden lg:table-cell">Due Date</TableHead>
                    <TableHead className="text-white font-semibold">Status</TableHead>
                    <TableHead className="text-white font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  ) : filteredInvoices.map(inv => {
                    const status = getStatus(inv)
                    return (
                      <TableRow key={inv.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">INV{String(inv.id).padStart(3, "0")}</TableCell>
                        <TableCell>{inv.student_name}</TableCell>
                        <TableCell className="hidden sm:table-cell">₹{Number(inv.amount).toLocaleString()}</TableCell>
                        <TableCell className="hidden md:table-cell">₹{Number(inv.paid_amount).toLocaleString()}</TableCell>
                        {/* ── NEW cell ── */}
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {fmtDate(inv.install_date)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{fmtDate(inv.due_date)}</TableCell>
                        <TableCell>
                          <Badge className={`${statusColor(status)} flex items-center gap-1 w-fit`}>
                            {statusIcon(status)}{status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                              onClick={() => { setSelected(inv); setViewOpen(true) }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                              onClick={() => openEdit(inv)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                              onClick={() => handlePrint(inv)}>
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:border-green-300"
                              onClick={() => handleWhatsAppShare(inv)}>
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" className="h-8 w-8 p-0"
                              onClick={() => handleDelete(inv.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create Invoice Modal ─────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">

            {/* Student Search */}
            <div className="space-y-2">
              <Label>Student <span className="text-destructive">*</span></Label>
              {selectedStudent ? (
                <div className="flex items-start justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm text-emerald-800">{selectedStudent.name}</p>
                    <p className="text-xs text-emerald-600">
                      {selectedStudent.standard && `Std ${selectedStudent.standard}`}
                      {selectedStudent.course && ` · ${selectedStudent.course}`}
                      {selectedStudent.location && ` · ${selectedStudent.location}`}
                    </p>
                    <p className="text-xs text-emerald-600">
                      📞 {selectedStudent.phone}
                      {selectedStudent.fee > 0 && (
                        <span className="ml-2">
                          · Fee: ₹{Number(selectedStudent.fee).toLocaleString()}
                          · Paid: ₹{Number(selectedStudent.paid_fee).toLocaleString()}
                          · <span className="font-medium">
                            Balance: ₹{(Number(selectedStudent.fee) - Number(selectedStudent.paid_fee)).toLocaleString()}
                          </span>
                        </span>
                      )}
                    </p>
                  </div>
                  <button onClick={clearStudent} className="text-emerald-500 hover:text-red-500 transition-colors ml-2 mt-0.5 shrink-0" title="Change student">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search student by name or phone..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      onFocus={() => { if (students.length > 0) setShowDropdown(true) }}
                      className="pl-9 pr-9"
                    />
                    {studentsLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {studentSearch && !studentsLoading && (
                      <button onClick={clearStudent} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {showDropdown && students.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                      {students.map(s => (
                        <button key={s.id} onClick={() => pickStudent(s)}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted text-left transition-colors border-b border-border/50 last:border-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 mt-0.5">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {[s.standard && `Std ${s.standard}`, s.course, s.phone].filter(Boolean).join(" · ")}
                            </p>
                            {s.fee > 0 && (
                              <p className="text-xs text-amber-600 font-medium mt-0.5">
                                Balance: ₹{(Number(s.fee) - Number(s.paid_fee)).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showDropdown && students.length === 0 && studentSearch.length > 0 && !studentsLoading && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg px-4 py-3 text-sm text-muted-foreground">
                      No students found for "{studentSearch}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Amount fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₹) <span className="text-destructive">*</span></Label>
                <Input type="number" value={form.amount} onChange={e => f("amount", e.target.value)} placeholder="Total fee" />
              </div>
              <div className="space-y-2">
                <Label>Paid (₹)</Label>
                <Input type="number" value={form.paid_amount} onChange={e => f("paid_amount", e.target.value)} placeholder="Amount paid" />
              </div>
            </div>

            {/* Installment Date + Transaction Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Installment Date</Label>
                <Input type="date" value={form.install_date} onChange={e => f("install_date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Transaction Type <span className="text-destructive">*</span></Label>
                <Select value={form.transaction_type} onValueChange={v => f("transaction_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">💵 Cash</SelectItem>
                    <SelectItem value="Online">🌐 Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Due Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.due_date} onChange={e => f("due_date", e.target.value)} />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => f("description", e.target.value)} placeholder="e.g. Tuition Fee – January" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Update Invoice" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Modal ───────────────────────────────────────── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Invoice Details</DialogTitle></DialogHeader>
          <button onClick={() => handleInvoicePrint(selected)}>Download invoice</button>
          {selected && (() => {
            const status = getStatus(selected)
            return (
              <div className="space-y-3">
                <div className="text-center pb-4 border-b">
                  <h3 className="text-lg font-bold text-blue-600">DNYANSAGAR CLASSESS</h3>
                  <p className="text-muted-foreground">Invoice #INV{String(selected.id).padStart(3, "0")}</p>
                </div>
                {([
                  ["Student", selected.student_name],
                  ["Description", selected.description],
                  ["Transaction Type", selected.transaction_type],
                  ["Install Date", fmtDate(selected.install_date)],
                  ["Due Date", fmtDate(selected.due_date)],
                  ["Total", `₹${Number(selected.amount).toLocaleString()}`],
                  ["Paid", `₹${Number(selected.paid_amount).toLocaleString()}`],
                  ["Balance", `₹${(Number(selected.amount) - Number(selected.paid_amount)).toLocaleString()}`],
                ] as [string, string | undefined][]).map(([l, v]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-muted-foreground">{l}:</span>
                    <span className="font-medium">{v ?? "—"}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={statusColor(status)}>{status}</Badge>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}