"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Receipt, Plus, Eye, Printer, Trash2, CheckCircle, Clock, AlertCircle,
  Loader2, Search, X, Edit2, FileSpreadsheet, MessageCircle, Upload, Download,
  Send, Settings2, CheckCircle2, XCircle, AlertTriangle, Zap,
} from "lucide-react"
import { invoicesApi, studentsApi } from "@/lib/api"

// ─── Types ────────────────────────────────────────────────────────────────────

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
type SendStatus = "idle" | "pending" | "uploading" | "sending" | "success" | "failed"

interface SendResult {
  invoiceId: number
  studentName: string
  phone: string
  status: SendStatus
  error?: string
  waMessageId?: string
}

// ─── WABA Config ──────────────────────────────────────────────────────────────

interface WABAConfig {
  accessToken: string
  phoneNumberId: string
  templateName: string
  templateId: string     // numeric template ID from Meta (e.g. "123456789")
  languageCode: string
}

const WABA_STORAGE_KEY = "dnyansagar_waba_config"

const loadWABAConfig = (): WABAConfig => {
  try {
    const raw = localStorage.getItem(WABA_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { accessToken: "", phoneNumberId: "", templateName: "fee_invoice_receipt", templateId: "", languageCode: "en" }
}

const saveWABAConfig = (cfg: WABAConfig) => {
  try { localStorage.setItem(WABA_STORAGE_KEY, JSON.stringify(cfg)) } catch {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("en-IN") : "—"
const fmtINR  = (n: number)   => new Intl.NumberFormat("en-IN").format(Math.round(n))

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ─── Build Invoice PNG Blob via html2canvas ───────────────────────────────────

async function buildInvoiceBlob(inv: Invoice): Promise<Blob> {
  // Dynamically import html2canvas (install: npm install html2canvas)
  const { default: html2canvas } = await import("html2canvas")

  const balance = Number(inv.amount) - Number(inv.paid_amount)
  const div = document.createElement("div")
  div.style.cssText = [
    "position:fixed", "top:-9999px", "left:-9999px",
    "width:794px", "padding:40px 44px", "background:#ffffff",
    "font-family:Arial,Helvetica,sans-serif", "color:#1a1a2e",
  ].join(";")

  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1f7fa6;padding-bottom:16px;margin-bottom:20px">
      <div>
        <div style="font-size:22px;font-weight:700;letter-spacing:.4px;color:#1a1a2e">DNYANSAGAR CLASSES</div>
        <div style="font-size:12.5px;color:#555;margin-top:4px">201/A, New Excelsior Building, Opp. Crown Hotel, KHADKI, Pune – 411003</div>
        <div style="font-size:12.5px;color:#555">Phone: 8862010906 &nbsp;|&nbsp; State: Maharashtra</div>
      </div>
      <div style="background:#1f7fa6;color:#fff;padding:8px 18px;border-radius:6px;font-size:13px;font-weight:600;text-align:center">
        <div>Payment</div><div>Receipt</div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:24px">
      <div style="width:48%">
        <div style="font-weight:700;margin-bottom:8px;color:#1f7fa6">BILL TO</div>
        <div><b>${inv.student_name}</b></div>
        <div style="color:#555;margin-top:3px">📞 ${inv.student_phone || "—"}</div>
        ${inv.course ? `<div style="color:#555;margin-top:3px">📘 ${inv.course}</div>` : ""}
        ${inv.standard ? `<div style="color:#555;margin-top:3px">Class: ${inv.standard}th Std</div>` : ""}
      </div>
      <div style="width:44%;text-align:right">
        <div style="font-weight:700;margin-bottom:8px;color:#1f7fa6">RECEIPT DETAILS</div>
        <div><b>Receipt No:</b> INV${String(inv.id).padStart(3,"0")}</div>
        <div style="margin-top:3px"><b>Paid Date:</b> ${fmtDate(inv.install_date)}</div>
        <div style="margin-top:3px"><b>Due Date:</b> ${fmtDate(inv.due_date)}</div>
        <div style="margin-top:3px"><b>Mode:</b> ${inv.transaction_type || "Cash"}</div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:13.5px">
      <thead>
        <tr style="background:#1f7fa6;color:#fff">
          <th style="padding:10px 12px;text-align:left;border-radius:4px 0 0 0">Description</th>
          <th style="padding:10px 12px;text-align:right;border-radius:0 4px 0 0">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:10px 12px">${inv.description || "Course Fee"}</td>
          <td style="padding:10px 12px;text-align:right">₹${fmtINR(Number(inv.amount))}</td>
        </tr>
        <tr style="background:#f0faf5">
          <td style="padding:10px 12px;font-weight:600;color:#197a3e">✅ Amount Paid</td>
          <td style="padding:10px 12px;text-align:right;font-weight:700;color:#197a3e">₹${fmtINR(Number(inv.paid_amount))}</td>
        </tr>
        <tr style="background:#fff8e1">
          <td style="padding:10px 12px;font-weight:600;color:#c0392b">📌 Balance Due</td>
          <td style="padding:10px 12px;text-align:right;font-weight:700;color:#c0392b">₹${fmtINR(balance)}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top:28px;font-size:12px;color:#777;border-top:1px solid #eee;padding-top:14px;display:flex;justify-content:space-between;align-items:flex-end">
      <div>
        Thank you for your trust in DNYANSAGAR CLASSES!<br/>
        <span style="color:#c0392b">⚠️ Fees once paid will not be refunded in any case.</span>
      </div>
      <div style="text-align:right;font-size:11px;color:#aaa">
        Generated: ${new Date().toLocaleDateString("en-IN")}
      </div>
    </div>
  `

  document.body.appendChild(div)
  try {
    const canvas = await html2canvas(div, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" })
    return await new Promise<Blob>((res, rej) =>
      canvas.toBlob(b => b ? res(b) : rej(new Error("Canvas blob failed")), "image/png", 0.95)
    )
  } finally {
    document.body.removeChild(div)
  }
}

// ─── Upload image → Meta media_id ────────────────────────────────────────────

async function uploadToMeta(blob: Blob, phoneNumberId: string, accessToken: string): Promise<string> {
  const form = new FormData()
  form.append("file", blob, "invoice.png")
  form.append("type", "image/png")
  form.append("messaging_product", "whatsapp")

  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message || `Media upload error ${res.status}`)
  return json.id as string
}

// ─── Send WhatsApp template message ──────────────────────────────────────────
// Template structure (create in Meta Business Manager):
//   Name    : fee_invoice_receipt  (or your custom name)
//   Category: UTILITY
//   Header  : IMAGE
//   Body    :
//     Greetings from DNYANSAGAR CLASSES,
//
//     Thank you for being a part of our institute. Please find the details
//     of your fee payment below.
//
//     📘 Fee Payment Details
//
//     👨‍🎓 Student Name: {{1}}
//     💰 Amount Paid: ₹{{2}}
//     📌 Balance: ₹{{3}}
//
//     ✅ Your payment has been received successfully. We appreciate your
//     trust in us and wish you success in your studies.
//
//     Regards,
//     DNYANSAGAR CLASSES

async function sendWABATemplate({
  to, mediaId, studentName, amountPaid, balance,
  phoneNumberId, accessToken, templateName, languageCode,
}: {
  to: string; mediaId: string; studentName: string
  amountPaid: string; balance: string
  phoneNumberId: string; accessToken: string
  templateName: string; languageCode: string
}): Promise<string> {
  const payload = {
    messaging_product: "whatsapp",
    to: to.replace(/\D/g, ""),
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: "header",
          parameters: [{ type: "image", image: { id: mediaId } }],
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: studentName },   // {{1}}
            { type: "text", text: amountPaid },     // {{2}}
            { type: "text", text: balance },        // {{3}}
          ],
        },
      ],
    },
  }

  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message || `Send error ${res.status}`)
  return json.messages?.[0]?.id || "sent"
}

// ─── WABA Settings Dialog ─────────────────────────────────────────────────────

function WABASettingsDialog({
  open, onClose, config, onSave,
}: {
  open: boolean
  onClose: () => void
  config: WABAConfig
  onSave: (c: WABAConfig) => void
}) {
  const [local, setLocal] = useState<WABAConfig>(config)
  useEffect(() => { setLocal(config) }, [config, open])
  const f = (k: keyof WABAConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setLocal(p => ({ ...p, [k]: e.target.value }))

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-green-600" />
            WhatsApp Business API Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 text-sm text-muted-foreground bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
          <p className="font-semibold text-green-700">📋 One-time Meta setup required:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Go to <b>Meta Business Manager → WhatsApp Manager → Message Templates</b></li>
            <li>Create template: name <code className="bg-green-100 px-1 rounded">fee_invoice_receipt</code>, category <b>UTILITY</b></li>
            <li>Header: <b>IMAGE</b> &nbsp;|&nbsp; Body: include <code>{"{{1}}"}</code> <code>{"{{2}}"}</code> <code>{"{{3}}"}</code></li>
            <li>Copy your <b>Template ID</b> (numeric) from the template list page</li>
            <li>Get <b>Access Token</b> + <b>Phone Number ID</b> from Meta Developer Console</li>
          </ol>
        </div>

        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Access Token <span className="text-red-500">*</span></Label>
            <Input value={local.accessToken} onChange={f("accessToken")} placeholder="EAAxxxxxxxxxxxxxxx..." type="password" />
            <p className="text-xs text-muted-foreground">Permanent token from Meta System User</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone Number ID <span className="text-red-500">*</span></Label>
              <Input value={local.phoneNumberId} onChange={f("phoneNumberId")} placeholder="1234567890123" />
            </div>
            <div className="space-y-1.5">
              <Label>Template ID <span className="text-red-500">*</span></Label>
              <Input value={local.templateId} onChange={f("templateId")} placeholder="9876543210987" />
              <p className="text-xs text-muted-foreground">Numeric ID from Meta</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Template Name <span className="text-red-500">*</span></Label>
              <Input value={local.templateName} onChange={f("templateName")} placeholder="fee_invoice_receipt" />
            </div>
            <div className="space-y-1.5">
              <Label>Language Code</Label>
              <Input value={local.languageCode} onChange={f("languageCode")} placeholder="en" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => { onSave(local); onClose() }}
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Bulk WABA Sender Dialog ──────────────────────────────────────────────────

function BulkWABASenderDialog({
  open, onClose, invoices, config,
}: {
  open: boolean
  onClose: () => void
  invoices: Invoice[]
  config: WABAConfig
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [results, setResults]   = useState<SendResult[]>([])
  const [running, setRunning]   = useState(false)
  const [step, setStep]         = useState<"select" | "sending" | "done">("select")
  const [filterMissing, setFilterMissing] = useState(false)
  const abortRef = useRef(false)

  const eligible   = invoices.filter(inv => !!inv.student_phone)
  const noPhone    = invoices.filter(inv => !inv.student_phone)
  const listSource = filterMissing ? noPhone : eligible

  useEffect(() => {
    if (!open) {
      setStep("select")
      setSelected(new Set())
      setResults([])
      setRunning(false)
      abortRef.current = false
    }
  }, [open])

  const toggleAll = () =>
    setSelected(prev =>
      prev.size === eligible.length ? new Set() : new Set(eligible.map(i => i.id))
    )
  const toggle = (id: number) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const setResult = (id: number, u: Partial<SendResult>) =>
    setResults(p => p.map(r => r.invoiceId === id ? { ...r, ...u } : r))

  const handleSend = async () => {
    if (!config.accessToken || !config.phoneNumberId || !config.templateName) {
      alert("WABA settings incomplete. Please configure Access Token, Phone Number ID and Template Name.")
      return
    }
    const toSend = eligible.filter(inv => selected.has(inv.id))
    if (!toSend.length) { alert("Select at least one invoice."); return }

    abortRef.current = false
    setResults(toSend.map(inv => ({
      invoiceId: inv.id, studentName: inv.student_name,
      phone: inv.student_phone!, status: "pending",
    })))
    setStep("sending")
    setRunning(true)

    for (const inv of toSend) {
      if (abortRef.current) break

      setResult(inv.id, { status: "uploading" })
      try {
        // Step 1: render invoice → PNG
        const blob = await buildInvoiceBlob(inv)

        // Step 2: upload to Meta
        setResult(inv.id, { status: "sending" })
        const mediaId = await uploadToMeta(blob, config.phoneNumberId, config.accessToken)

        // Step 3: send template
        const amount  = Number(inv.amount)
        const paid    = Number(inv.paid_amount)
        const balance = amount - paid
        const waId    = await sendWABATemplate({
          to: inv.student_phone!,
          mediaId,
          studentName: inv.student_name,
          amountPaid: fmtINR(paid),
          balance: fmtINR(balance),
          phoneNumberId: config.phoneNumberId,
          accessToken: config.accessToken,
          templateName: config.templateName,
          languageCode: config.languageCode || "en",
        })
        setResult(inv.id, { status: "success", waMessageId: waId })
      } catch (err: any) {
        setResult(inv.id, { status: "failed", error: err?.message || "Unknown error" })
      }

      // Respect WhatsApp rate limits (~80 msg/s; we add a small delay)
      await sleep(400)
    }

    setRunning(false)
    setStep("done")
  }

  const successCount = results.filter(r => r.status === "success").length
  const failCount    = results.filter(r => r.status === "failed").length
  const pendingCount = results.filter(r => r.status === "pending" || r.status === "uploading" || r.status === "sending").length

  const statusBadge = (s: SendStatus) => {
    const map: Record<SendStatus, { label: string; cls: string; icon: React.ReactNode }> = {
      idle:      { label: "Idle",      cls: "bg-gray-100 text-gray-600",        icon: <Clock className="h-3 w-3" /> },
      pending:   { label: "Queued",    cls: "bg-blue-100 text-blue-700",        icon: <Clock className="h-3 w-3" /> },
      uploading: { label: "Uploading", cls: "bg-yellow-100 text-yellow-700",    icon: <Loader2 className="h-3 w-3 animate-spin" /> },
      sending:   { label: "Sending",   cls: "bg-purple-100 text-purple-700",    icon: <Loader2 className="h-3 w-3 animate-spin" /> },
      success:   { label: "Sent ✓",    cls: "bg-emerald-100 text-emerald-700",  icon: <CheckCircle2 className="h-3 w-3" /> },
      failed:    { label: "Failed",    cls: "bg-red-100 text-red-700",          icon: <XCircle className="h-3 w-3" /> },
    }
    const m = map[s]
    return (
      <Badge className={`${m.cls} flex items-center gap-1 text-xs`}>
        {m.icon}{m.label}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={running ? undefined : onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </div>
            Bulk WhatsApp Sender (WABA)
          </DialogTitle>
        </DialogHeader>

        {/* ── SELECT STEP ─────────────────────────────────────────── */}
        {step === "select" && (
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-700">{eligible.length}</div>
                <div className="text-xs text-green-600">With Phone</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-700">{noPhone.length}</div>
                <div className="text-xs text-amber-600">No Phone</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-700">{selected.size}</div>
                <div className="text-xs text-blue-600">Selected</div>
              </div>
            </div>

            {noPhone.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {noPhone.length} invoice(s) have no phone number and cannot be sent.
                <button className="underline ml-auto" onClick={() => setFilterMissing(f => !f)}>
                  {filterMissing ? "Show all" : "Show missing"}
                </button>
              </div>
            )}

            {/* Table */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selected.size === eligible.length && eligible.length > 0}
                  onCheckedChange={toggleAll}
                  id="selectAll"
                />
                <label htmlFor="selectAll" className="text-sm font-medium cursor-pointer">
                  Select all ({eligible.length})
                </label>
              </div>
              <span className="text-xs text-muted-foreground">{selected.size} selected</span>
            </div>

            <div className="overflow-y-auto flex-1 rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(filterMissing ? noPhone : eligible).map(inv => {
                    const balance = Number(inv.amount) - Number(inv.paid_amount)
                    const st = getStatus(inv)
                    return (
                      <TableRow
                        key={inv.id}
                        className={`cursor-pointer hover:bg-muted/50 ${selected.has(inv.id) ? "bg-green-50" : ""}`}
                        onClick={() => !filterMissing && toggle(inv.id)}
                      >
                        <TableCell>
                          {!filterMissing && (
                            <Checkbox
                              checked={selected.has(inv.id)}
                              onCheckedChange={() => toggle(inv.id)}
                              onClick={e => e.stopPropagation()}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{inv.student_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{inv.student_phone || <span className="text-red-400">Missing</span>}</TableCell>
                        <TableCell>₹{fmtINR(Number(inv.amount))}</TableCell>
                        <TableCell className={balance > 0 ? "text-red-600 font-medium" : "text-emerald-600"}>
                          ₹{fmtINR(balance)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusColor(st)} text-xs`}>{st}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {listSource.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {filterMissing ? "No invoices with missing phone numbers." : "No invoices with phone numbers found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <DialogFooter className="mt-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                onClick={handleSend}
                disabled={selected.size === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Send {selected.size > 0 ? `${selected.size} Invoice${selected.size > 1 ? "s" : ""}` : "Invoices"} via WhatsApp
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── SENDING / DONE STEP ─────────────────────────────────── */}
        {(step === "sending" || step === "done") && (
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            {/* Progress summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-emerald-700">{successCount}</div>
                <div className="text-xs text-emerald-600">Sent</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-700">{failCount}</div>
                <div className="text-xs text-red-600">Failed</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-700">{pendingCount}</div>
                <div className="text-xs text-blue-600">Remaining</div>
              </div>
            </div>

            {step === "sending" && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-green-600 shrink-0" />
                <div className="text-sm text-green-700">
                  <span className="font-semibold">Sending in progress…</span>
                  <span className="ml-2 text-green-600">Generating receipt images &amp; sending via WABA</span>
                </div>
                <Button
                  size="sm" variant="outline"
                  className="ml-auto text-red-600 border-red-300 hover:bg-red-50 shrink-0"
                  onClick={() => { abortRef.current = true }}
                >
                  Stop
                </Button>
              </div>
            )}

            {step === "done" && (
              <div className={`flex items-center gap-3 rounded-lg px-4 py-3 ${failCount === 0 ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
                {failCount === 0
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  : <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                }
                <span className={`text-sm font-semibold ${failCount === 0 ? "text-emerald-700" : "text-amber-700"}`}>
                  {failCount === 0
                    ? `All ${successCount} messages sent successfully!`
                    : `Done — ${successCount} sent, ${failCount} failed`}
                </span>
              </div>
            )}

            {/* Per-invoice result log */}
            <div className="overflow-y-auto flex-1 rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Student</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map(r => (
                    <TableRow key={r.invoiceId}>
                      <TableCell className="font-medium text-sm">{r.studentName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.phone}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {r.status === "success" && r.waMessageId && <span className="text-emerald-600">ID: {r.waMessageId}</span>}
                        {r.status === "failed" && r.error && <span className="text-red-500">{r.error}</span>}
                        {(r.status === "uploading") && <span className="text-yellow-600">Generating &amp; uploading receipt…</span>}
                        {(r.status === "sending") && <span className="text-purple-600">Sending via WhatsApp…</span>}
                        {r.status === "pending" && <span className="text-blue-500">Waiting in queue…</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={running}
              >
                {running ? "Sending…" : "Close"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN InvoicesContent Component
// ─────────────────────────────────────────────────────────────────────────────

export function InvoicesContent() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [summary, setSummary] = useState<Summary>({ total_invoiced: 0, total_paid: 0, total_pending: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [studentFilter, setStudentFilter] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // WABA state
  const [wabaConfig, setWabaConfig]   = useState<WABAConfig>(loadWABAConfig)
  const [wabaSettingsOpen, setWabaSettingsOpen] = useState(false)
  const [wabaSenderOpen, setWabaSenderOpen]     = useState(false)

  const [students, setStudents] = useState<Student[]>([])
  const [studentSearch, setStudentSearch] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentsLoading, setStudentsLoading] = useState(false)

  const [form, setForm] = useState({
    student_name: "", amount: "", paid_amount: "",
    due_date: "", install_date: "", transaction_type: "Cash",
    description: "", student_id: "",
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
    if (!studentSearch.trim()) { setStudents([]); setShowDropdown(false); return }
    const timer = setTimeout(async () => {
      setStudentsLoading(true)
      try {
        const res: any = await studentsApi.getAll({ search: studentSearch })
        setStudents(res.data || []); setShowDropdown(true)
      } catch { setStudents([]) }
      finally { setStudentsLoading(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [studentSearch])

  const pickStudent = (s: Student) => {
    setSelectedStudent(s); setStudentSearch(s.name); setShowDropdown(false)
    const remaining = Number(s.fee) - Number(s.paid_fee)
    setForm(prev => ({
      ...prev, student_name: s.name, student_id: String(s.id),
      amount: remaining > 0 ? String(remaining) : String(s.fee),
      paid_amount: "0",
      description: `Tuition Fee – ${s.course || s.standard + "th Std"}`,
    }))
  }

  const clearStudent = () => {
    setSelectedStudent(null); setStudentSearch(""); setStudents([]); setShowDropdown(false)
    setForm(prev => ({ ...prev, student_name: "", student_id: "", amount: "", paid_amount: "", description: "" }))
  }

  const openModal = () => {
    setEditing(null); clearStudent()
    setForm({ student_name: "", amount: "", paid_amount: "", due_date: "", install_date: "", transaction_type: "Cash", description: "", student_id: "" })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.student_name || !form.amount || !form.due_date) { alert("Fill required fields"); return }
    setSaving(true)
    try {
      const payload = {
        student_name: form.student_name, student_id: form.student_id || undefined,
        amount: parseFloat(form.amount), paid_amount: parseFloat(form.paid_amount) || 0,
        due_date: form.due_date, install_date: form.install_date || undefined,
        transaction_type: form.transaction_type, description: form.description,
      }
      if (editing) await invoicesApi.update(editing.id, payload)
      else await invoicesApi.create(payload)
      setModalOpen(false); setEditing(null); load()
    } catch (err: any) { alert(err.message) }
    finally { setSaving(false) }
  }

  const openEdit = (inv: Invoice) => {
    setEditing(inv)
    setSelectedStudent({ id: Number(inv.student_id || 0), name: inv.student_name || "", phone: "", standard: inv.standard || "", course: inv.course || "", location: "", fee: Number(inv.amount || 0), paid_fee: Number(inv.paid_amount || 0), father_name: "" })
    setStudentSearch(inv.student_name || ""); setShowDropdown(false)
    setForm({
      student_name: inv.student_name || "", student_id: inv.student_id || "",
      amount: String(inv.amount ?? ""), paid_amount: String(inv.paid_amount ?? 0),
      due_date: inv.due_date ? new Date(inv.due_date).toISOString().split("T")[0] : "",
      install_date: inv.install_date ? new Date(inv.install_date).toISOString().split("T")[0] : "",
      transaction_type: inv.transaction_type || "Cash", description: inv.description || "",
    })
    setModalOpen(true)
  }

  const handleExportExcel = () => {
    if (!invoices.length) { alert("No invoices to export"); return }
    const headers = ["Invoice ID","Student Name","Student ID","Amount","Paid Amount","Balance","Install Date","Due Date","Transaction Type","Status","Description"]
    const rows = invoices.map(inv => {
      const amount = Number(inv.amount || 0); const paid = Number(inv.paid_amount || 0)
      return [`INV${String(inv.id).padStart(3,"0")}`, inv.student_name || "", inv.student_id || "", amount, paid, amount - paid,
        inv.install_date ? new Date(inv.install_date).toLocaleDateString("en-CA") : "",
        inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-CA") : "",
        inv.transaction_type || "", getStatus(inv), inv.description || ""]
    })
    const esc = (v: string | number) => `"${String(v).replace(/"/g,'""')}"`
    const csv = [headers, ...rows].map(r => r.map(esc).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob)
    a.download = `invoices_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href)
  }

  const downloadTemplate = () => {
    const headers = ["student_name","amount","paid_amount","install_date","due_date","transaction_type","description"]
    const sample  = ["John Doe","5000","2000","2024-01-15","2024-02-15","Cash","Tuition Fee – January"]
    const csv = [headers, sample].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob)
    a.download = "invoice_import_template.csv"
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const [, ...rows] = text.split(/\r?\n/).filter(l => l.trim())
      let success = 0, failed = 0
      for (const row of rows) {
        const cols = row.match(/("(?:[^"]|"")*"|[^,]*)/g)?.map(c => c.replace(/^"|"$/g,"").replace(/""/g,'"').trim()) ?? []
        const [student_name, amount, paid_amount, install_date, due_date, transaction_type, description] = cols
        if (!student_name || !amount || !due_date) { failed++; continue }
        try {
          await invoicesApi.create({ student_name, amount: parseFloat(amount)||0, paid_amount: parseFloat(paid_amount)||0, install_date: install_date||undefined, due_date, transaction_type: transaction_type||"Cash", description: description||"" })
          success++
        } catch { failed++ }
      }
      alert(`Import complete: ${success} imported, ${failed} failed.`); load()
    } catch { alert("Failed to read file.") }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = "" }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this invoice?")) return
    try { await invoicesApi.remove(id); load() } catch (err: any) { alert(err.message) }
  }

  const handlePrint = (inv: Invoice) => {
    const w = window.open("", "_blank"); if (!w) return
    const balance = Number(inv.amount) - Number(inv.paid_amount)
    w.document.write(`<html><head><title>Receipt #${inv.id}</title><style>@page{size:A4;margin:25mm}body{font-family:Arial,Helvetica,sans-serif;color:#333;margin:0}.container{width:100%}.header{display:flex;justify-content:space-between;align-items:flex-start}.institute h2{margin:0;font-size:20px;letter-spacing:0.5px}.institute p{margin:2px 0;font-size:13px}.logo{width:70px}.title{text-align:center;font-size:22px;color:#1f7fa6;font-weight:bold;margin-top:15px;padding-top:10px;border-top:2px solid #1f7fa6}.content{display:flex;justify-content:space-between;margin-top:25px}.left{width:48%}.right{width:48%}.label{font-weight:bold;margin-top:10px}.text{margin-top:4px}.receipt-details{text-align:right;font-size:14px;margin-bottom:15px}.table{width:100%;border-collapse:collapse}.table td{padding:6px 0;font-size:14px}.table td:last-child{text-align:right;font-weight:bold}.balance{border-top:1px solid #999;padding-top:6px}.signature{margin-top:70px;text-align:right}.auth{font-weight:bold;margin-top:6px}</style></head><body><div class="container"><div class="header"><div class="institute"><h2>DNYANSAGAR CLASSES</h2><p>201/A, New Excelsior Building Opp. Crown Hotel, KHADKI Pune - 411003</p><p>Phone no : 8862010906</p><p>State: Maharashtra</p></div><img class="logo" src="/logo.jpeg"/></div><div class="title">Payment Receipt</div><div class="content"><div class="left"><div class="label">Received From</div><div class="text">${inv.student_name}</div><div class="text">Contact No : ${inv.student_phone || "-"}</div><div class="label">Amount in words</div><div class="text">${Number(inv.paid_amount).toLocaleString()} Rupees only</div></div><div class="right"><div class="receipt-details"><div><b>Receipt Details</b></div><div>Receipt No : ${inv.id}</div><div><b>Date :</b> ${fmtDate(inv.install_date)}</div></div><table class="table"><tr><td>Received</td><td>₹ ${Number(inv.paid_amount).toLocaleString()}</td></tr><tr><td>Payment mode</td><td>${inv.transaction_type || "Online"}</td></tr><tr><td>Previous Balance</td><td>₹ ${Number(inv.amount).toLocaleString()}</td></tr><tr class="balance"><td>Current Balance</td><td>₹ ${balance}</td></tr></table></div></div><div class="signature"><div>For : DNYANSAGAR CLASSES</div><img src="${window.location.origin}/sign.jpeg" style="height:60px;margin:8px 0;display:block;margin-left:auto"/><div class="auth">Authorized Signatory</div></div></div></body></html>`)
    w.document.close(); w.print()
  }

  const handleInvoicePrint = (inv: Invoice | null) => {
    const w = window.open("", "_blank"); if (!w) return
    const balance = Number(inv?.amount) - Number(inv?.paid_amount)
    w.document.write(`<html><head><title>Invoice #${inv?.id}</title><style>@page{size:A4;margin:20mm}body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#333}.container{width:100%}.header{display:flex;justify-content:space-between;border-bottom:2px solid #1f7fa6;padding-bottom:10px}.institute h2{margin:0;font-size:20px}.institute p{margin:2px 0;font-size:13px}.logo{width:70px}.title{text-align:center;color:#1f7fa6;font-size:22px;font-weight:bold;margin:15px 0}.top{display:flex;justify-content:space-between;margin-top:10px}.table{width:100%;border-collapse:collapse;margin-top:15px}.table th,.table td{padding:8px;font-size:14px}.table td{border-bottom:1px solid #ddd}.table td:last-child,.table th:last-child{text-align:right}.summary{display:flex;justify-content:space-between;margin-top:20px}.left-summary{width:55%;font-size:14px}.right-summary{width:40%}.right-summary table{width:100%;font-size:14px}.right-summary td{padding:6px 0}.right-summary td:last-child{text-align:right}.total{font-weight:bold;padding:6px}.footer{display:flex;justify-content:space-between;margin-top:40px}.bank{font-size:13px}.qr{width:90px}.signature{text-align:right}.signature img{height:40px}.auth{font-weight:bold;margin-top:5px}</style></head><body><div class="container"><div class="header"><div class="institute"><h2>DNYANSAGAR CLASSES</h2><p>201/A, New Excelsior Building Opp. Crown Hotel, KHADKI Pune - 411003</p><p>Phone : 8862010906</p><p>State : Maharashtra</p></div><img class="logo" src="${window.location.origin}/logo.jpeg"/></div><div class="title">Tax Invoice</div><div class="top"><div class="invoice-details"><p><b>Invoice No :</b> ${inv?.id}</p><p><b>Date :</b> ${fmtDate(inv?.install_date)}</p></div></div><div class="section-title">BILL TO</div><p><b>Name:</b> ${inv?.student_name}</p><p><b>Student ID:</b> ${inv?.student_id || "-"}</p><p><b>Standard:</b> ${inv?.standard || "-"}</p><p><b>Course:</b> ${inv?.course || "-"}</p><table class="table"><thead><tr><th>Description</th><th>Course</th><th>Transaction</th><th>Paid Date</th><th>Due Date</th><th>Amount</th></tr></thead><tbody><tr><td>${inv?.description || "Course Fee"}</td><td>${inv?.course || "-"}</td><td>${inv?.transaction_type || "Cash"}</td><td>${fmtDate(inv?.install_date)}</td><td>${fmtDate(inv?.due_date)}</td><td>₹${Number(inv?.amount).toLocaleString()}</td></tr><tr class="total"><td colspan="5">TOTAL</td><td>₹${Number(inv?.amount).toLocaleString()}</td></tr></tbody></table><div class="summary"><div class="left-summary"><b>Invoice Amount In Words</b><br/>${Number(inv?.amount).toLocaleString()} Rupees only<br/><br/><b>Terms and Conditions</b><br/>FEES ONCE PAID WILL NOT BE REFUNDED IN ANY CASES<br/>Thank You!<br/>DNYANSAGAR CLASSES</div><div class="right-summary"><table><tr><td>Sub Total</td><td>₹ ${Number(inv?.amount).toLocaleString()}</td></tr><tr class="total"><td>Total</td><td>₹ ${Number(inv?.amount).toLocaleString()}</td></tr><tr><td>Received</td><td>₹ ${Number(inv?.paid_amount).toLocaleString()}</td></tr><tr><td>Balance</td><td>₹ ${balance.toLocaleString()}</td></tr><tr><td>Payment mode</td><td>${inv?.transaction_type || "Online"}</td></tr></table></div></div><div class="footer"><div class="bank"><img class="qr" src="${window.location.origin}/qr.png"/><br/><b>Pay To:</b><br/>Bank Name : HDFC BANK<br/>Account No : 50200066917533<br/>IFSC : HDFC0001791<br/>Account Name : Vidyaaniketan Professional Academy</div><div class="signature"><div>For : Vidyaaniketan Professional Academy</div><img src="${window.location.origin}/sign.jpeg"/><div class="auth">Authorized Signatory</div></div></div></div></body></html>`)
    w.document.close(); w.print()
  }

  const handleWhatsAppShare = (inv: Invoice) => {
    const amount  = Number(inv.amount || 0)
    const paid    = Number(inv.paid_amount || 0)
    const balance = amount - paid
    const message = [
      "Greetings from DNYANSAGAR CLASSES,", "",
      "Thank you for being a part of our institute. Please find the details of your fee payment below.", "",
      "📘 *Fee Payment Details*", "",
      `👨‍🎓 *Student Name:* ${inv.student_name || "-"}`,
      `💰 *Amount Paid:* ₹${fmtINR(paid)}`,
      `📌 *Balance:* ₹${fmtINR(balance)}`, "",
      "✅ Your payment has been received successfully. We appreciate your trust in us and wish you success in your studies.", "",
      "Regards,", "DNYANSAGAR CLASSES",
    ].join("\n")
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer")
  }

  const handleSaveWABAConfig = (cfg: WABAConfig) => {
    setWabaConfig(cfg); saveWABAConfig(cfg)
  }

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const filteredInvoices = invoices.filter(inv =>
    inv.student_name?.toLowerCase().includes(studentFilter.trim().toLowerCase())
  )
  const configuredWABA = !!(wabaConfig.accessToken && wabaConfig.phoneNumberId && wabaConfig.templateName)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pt-12 lg:pt-0">

      {/* WABA Settings & Bulk Sender Dialogs */}
      <WABASettingsDialog
        open={wabaSettingsOpen}
        onClose={() => setWabaSettingsOpen(false)}
        config={wabaConfig}
        onSave={handleSaveWABAConfig}
      />
      <BulkWABASenderDialog
        open={wabaSenderOpen}
        onClose={() => setWabaSenderOpen(false)}
        invoices={filteredInvoices}
        config={wabaConfig}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Invoiced",   value: summary.total_invoiced,  cls: "from-blue-500 to-blue-600" },
          { label: "Total Collected",  value: summary.total_paid,      cls: "from-emerald-500 to-emerald-600" },
          { label: "Pending Amount",   value: summary.total_pending,   cls: "from-amber-500 to-amber-600" },
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
          <div className="flex flex-wrap gap-2">

            {/* Search */}
            <div className="relative w-full sm:w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={studentFilter} onChange={e => setStudentFilter(e.target.value)} placeholder="Search student..." className="pl-9" />
            </div>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                {["all","Paid","Partial","Pending","Overdue"].map(s => (
                  <SelectItem key={s} value={s}>{s === "all" ? "All Status" : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Export */}
            <Button onClick={handleExportExcel} variant="outline">
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Export
            </Button>

            {/* Template */}
            <Button onClick={downloadTemplate} variant="outline" title="Download import template CSV">
              <Download className="h-4 w-4 mr-2" /> Template
            </Button>

            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />

            {/* Import CSV */}
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={importing} className="border-violet-300 text-violet-700 hover:bg-violet-50">
              {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {importing ? "Importing…" : "Import CSV"}
            </Button>

            {/* ── WABA Settings button ── */}
            <Button
              variant="outline"
              onClick={() => setWabaSettingsOpen(true)}
              className={`border-green-300 hover:bg-green-50 ${configuredWABA ? "text-green-700" : "text-amber-600 border-amber-300 hover:bg-amber-50"}`}
              title={configuredWABA ? "WABA configured" : "Configure WhatsApp Business API"}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              {configuredWABA ? "WABA ✓" : "Setup WABA"}
            </Button>

            {/* ── Bulk WhatsApp Send button ── */}
            <Button
              onClick={() => {
                if (!configuredWABA) { setWabaSettingsOpen(true); return }
                setWabaSenderOpen(true)
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <Zap className="h-3.5 w-3.5" />
                Bulk Send
              </div>
            </Button>

            {/* New Invoice */}
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
                    <TableHead className="text-white font-semibold hidden lg:table-cell">Paid Date</TableHead>
                    <TableHead className="text-white font-semibold hidden lg:table-cell">Due Date</TableHead>
                    <TableHead className="text-white font-semibold">Status</TableHead>
                    <TableHead className="text-white font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No invoices found</TableCell>
                    </TableRow>
                  ) : filteredInvoices.map(inv => {
                    const status = getStatus(inv)
                    return (
                      <TableRow key={inv.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">INV{String(inv.id).padStart(3,"0")}</TableCell>
                        <TableCell>{inv.student_name}</TableCell>
                        <TableCell className="hidden sm:table-cell">₹{Number(inv.amount).toLocaleString()}</TableCell>
                        <TableCell className="hidden md:table-cell">₹{Number(inv.paid_amount).toLocaleString()}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{fmtDate(inv.install_date)}</TableCell>
                        <TableCell className="hidden lg:table-cell">{fmtDate(inv.due_date)}</TableCell>
                        <TableCell>
                          <Badge className={`${statusColor(status)} flex items-center gap-1 w-fit`}>
                            {statusIcon(status)}{status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => { setSelected(inv); setViewOpen(true) }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => openEdit(inv)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handlePrint(inv)}>
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:border-green-300" onClick={() => handleWhatsAppShare(inv)}>
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={() => handleDelete(inv.id)}>
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

      {/* ── Create / Edit Invoice Modal ───────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
                        <span className="ml-2">· Fee: ₹{Number(selectedStudent.fee).toLocaleString()} · Paid: ₹{Number(selectedStudent.paid_fee).toLocaleString()} · <span className="font-medium">Balance: ₹{(Number(selectedStudent.fee)-Number(selectedStudent.paid_fee)).toLocaleString()}</span></span>
                      )}
                    </p>
                  </div>
                  <button onClick={clearStudent} className="text-emerald-500 hover:text-red-500 transition-colors ml-2 mt-0.5 shrink-0"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search student by name or phone..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} onFocus={() => { if (students.length > 0) setShowDropdown(true) }} className="pl-9 pr-9" />
                    {studentsLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                    {studentSearch && !studentsLoading && <button onClick={clearStudent} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
                  </div>
                  {showDropdown && students.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                      {students.map(s => (
                        <button key={s.id} onClick={() => pickStudent(s)} className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted text-left transition-colors border-b border-border/50 last:border-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 mt-0.5">{s.name.charAt(0).toUpperCase()}</div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{[s.standard && `Std ${s.standard}`, s.course, s.phone].filter(Boolean).join(" · ")}</p>
                            {s.fee > 0 && <p className="text-xs text-amber-600 font-medium mt-0.5">Balance: ₹{(Number(s.fee)-Number(s.paid_fee)).toLocaleString()}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showDropdown && students.length === 0 && studentSearch.length > 0 && !studentsLoading && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg px-4 py-3 text-sm text-muted-foreground">No students found for "{studentSearch}"</div>
                  )}
                </div>
              )}
            </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Paid Date</Label>
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
            <div className="space-y-2">
              <Label>Due Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.due_date} onChange={e => f("due_date", e.target.value)} />
            </div>
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
                  <h3 className="text-lg font-bold text-blue-600">DNYANSAGAR CLASSES</h3>
                  <p className="text-muted-foreground">Invoice #INV{String(selected.id).padStart(3,"0")}</p>
                </div>
                {([
                  ["Student", selected.student_name],
                  ["Description", selected.description],
                  ["Transaction Type", selected.transaction_type],
                  ["Paid Date", fmtDate(selected.install_date)],
                  ["Due Date", fmtDate(selected.due_date)],
                  ["Total", `₹${Number(selected.amount).toLocaleString()}`],
                  ["Paid", `₹${Number(selected.paid_amount).toLocaleString()}`],
                  ["Balance", `₹${(Number(selected.amount)-Number(selected.paid_amount)).toLocaleString()}`],
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