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

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────

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
  id: number; name: string; phone: string; standard: string
  course: string; location: string; fee: number; paid_fee: number; father_name: string
}

interface Summary { total_invoiced: number; total_paid: number; total_pending: number }
type InvoiceStatus = "Paid" | "Partial" | "Pending" | "Overdue"
type SendStatus    = "idle" | "pending" | "rendering" | "sending" | "success" | "failed"

interface SendResult {
  invoiceId: number; studentName: string; phone: string
  status: SendStatus; error?: string; msgId?: string
}

// ─────────────────────────────────────────────────────────────────────────────
//  RHAITECH CONFIG
//  Docs: POST https://api.rhaitech.online/api/create-message  (multipart/form-data)
//  Fields: appkey, authkey, to, template_id, language, file (public URL),
//          variables[{key}] per variable
// ─────────────────────────────────────────────────────────────────────────────

interface RhaitechConfig {
  appkey:              string   // your app key
  authkey:             string   // your auth key
  templateId:          string   // numeric template id from rhaitech dashboard
  language:            string   // e.g. en_us
  varKeyName:          string   // variable key for student name  e.g. {student_name}
  varKeyPaid:          string   // variable key for amount paid   e.g. {amount_paid}
  varKeyBalance:       string   // variable key for balance       e.g. {balance}
  imageUploadEndpoint: string   // your server endpoint that accepts PNG and returns { url }
}

const CFG_KEY = "dnyansagar_rhaitech_cfg"

const defaultConfig = (): RhaitechConfig => ({
  appkey:              "f67908d5-5aa9-49d9-8c56-9572272ea6d0",
  authkey:             "ppIYRYOlXVAd41QhiCDu6scku4jfJG0vTVBuLpsj395dXCT8wj",
  templateId:          "",
  language:            "en_us",
  varKeyName:          "{student_name}",
  varKeyPaid:          "{amount_paid}",
  varKeyBalance:       "{balance}",
  imageUploadEndpoint: "",
})

const loadCfg = (): RhaitechConfig => {
  try {
    if (typeof window === "undefined") return defaultConfig()
    const raw = localStorage.getItem(CFG_KEY)
    if (raw) return { ...defaultConfig(), ...JSON.parse(raw) }
  } catch {}
  return defaultConfig()
}
const saveCfg = (c: RhaitechConfig) => {
  try { localStorage.setItem(CFG_KEY, JSON.stringify(c)) } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getStatus = (inv: Invoice): InvoiceStatus => {
  const amount = Number(inv.amount), paid = Number(inv.paid_amount)
  if (paid >= amount) return "Paid"
  if (paid > 0)       return "Partial"
  if (inv.due_date && new Date(inv.due_date) < new Date()) return "Overdue"
  return "Pending"
}

const statusColor = (s: string) => ({
  Paid: "bg-emerald-100 text-emerald-700", Partial: "bg-yellow-100 text-yellow-700",
  Pending: "bg-blue-100 text-blue-700",   Overdue: "bg-red-100 text-red-700",
}[s] ?? "bg-gray-100 text-gray-700")

const statusIcon = (s: string) => ({
  Paid:    <CheckCircle className="h-4 w-4" />,
  Partial: <Clock className="h-4 w-4" />,
  Pending: <Clock className="h-4 w-4" />,
  Overdue: <AlertCircle className="h-4 w-4" />,
}[s] ?? null)

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("en-IN") : "—"
const fmtINR  = (n: number)  => new Intl.NumberFormat("en-IN").format(Math.round(n))
const sleep   = (ms: number) => new Promise(r => setTimeout(r, ms))

// ─────────────────────────────────────────────────────────────────────────────
//  STEP 1 — Render invoice → PNG Blob  via html2canvas
//  Install:  npm install html2canvas
// ─────────────────────────────────────────────────────────────────────────────

async function buildInvoiceBlob(inv: Invoice): Promise<Blob> {
  const { default: html2canvas } = await import("html2canvas")
  const balance = Number(inv.amount) - Number(inv.paid_amount)

  const div = document.createElement("div")
  div.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:794px;padding:40px 44px;" +
    "background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;"

  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;
      border-bottom:3px solid #1f7fa6;padding-bottom:16px;margin-bottom:20px">
      <div>
        <div style="font-size:22px;font-weight:700;color:#1a1a2e">DNYANSAGAR CLASSES</div>
        <div style="font-size:12px;color:#555;margin-top:3px">
          201/A, New Excelsior Building, Opp. Crown Hotel, KHADKI, Pune – 411003
        </div>
        <div style="font-size:12px;color:#555">Phone: 8862010906 | State: Maharashtra</div>
      </div>
      <div style="background:#1f7fa6;color:#fff;padding:8px 18px;border-radius:6px;
        font-size:13px;font-weight:600;text-align:center">
        <div>Payment</div><div>Receipt</div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:22px">
      <div>
        <div style="font-weight:700;color:#1f7fa6;margin-bottom:6px">BILL TO</div>
        <div style="font-weight:600">${inv.student_name}</div>
        <div style="color:#555;margin-top:2px">Contact: ${inv.student_phone || "—"}</div>
        ${inv.course   ? `<div style="color:#555;margin-top:2px">Course: ${inv.course}</div>` : ""}
        ${inv.standard ? `<div style="color:#555;margin-top:2px">Class: ${inv.standard}th Std</div>` : ""}
        <div style="color:#555;margin-top:2px">Desc: ${inv.description || "Course Fee"}</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700;color:#1f7fa6;margin-bottom:6px">RECEIPT DETAILS</div>
        <div><b>Receipt No:</b> INV${String(inv.id).padStart(3, "0")}</div>
        <div style="margin-top:2px"><b>Paid Date:</b> ${fmtDate(inv.install_date)}</div>
        <div style="margin-top:2px"><b>Due Date:</b>  ${fmtDate(inv.due_date)}</div>
        <div style="margin-top:2px"><b>Mode:</b>      ${inv.transaction_type || "Cash"}</div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr style="background:#1f7fa6;color:#fff">
        <th style="padding:10px 12px;text-align:left">Description</th>
        <th style="padding:10px 12px;text-align:right">Amount</th>
      </tr>
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:9px 12px">${inv.description || "Course Fee"}</td>
        <td style="padding:9px 12px;text-align:right">₹${fmtINR(Number(inv.amount))}</td>
      </tr>
      <tr style="background:#f0faf5">
        <td style="padding:9px 12px;font-weight:600;color:#197a3e">✅ Amount Paid</td>
        <td style="padding:9px 12px;text-align:right;font-weight:700;color:#197a3e">
          ₹${fmtINR(Number(inv.paid_amount))}
        </td>
      </tr>
      <tr style="background:#fff8e1">
        <td style="padding:9px 12px;font-weight:600;color:#c0392b">📌 Balance Due</td>
        <td style="padding:9px 12px;text-align:right;font-weight:700;color:#c0392b">
          ₹${fmtINR(balance)}
        </td>
      </tr>
    </table>

    <div style="margin-top:24px;font-size:11px;color:#888;border-top:1px solid #eee;
      padding-top:12px;display:flex;justify-content:space-between">
      <div>
        Thank you for trusting DNYANSAGAR CLASSES!<br/>
        <span style="color:#c0392b">Fees once paid will not be refunded.</span>
      </div>
      <div>Generated: ${new Date().toLocaleDateString("en-IN")}</div>
    </div>
  `

  document.body.appendChild(div)
  try {
    const canvas = await html2canvas(div, {
      scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff",
    })
    return await new Promise<Blob>((res, rej) =>
      canvas.toBlob(b => b ? res(b) : rej(new Error("Canvas blob failed")), "image/png", 0.95)
    )
  } finally {
    document.body.removeChild(div)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  STEP 2 — Upload PNG to YOUR server → get a public URL back
//
//  Your Next.js API route example  (app/api/upload-invoice/route.ts):
//
//  export async function POST(req: Request) {
//    const form = await req.formData()
//    const file = form.get("file") as File
//    const buffer = Buffer.from(await file.arrayBuffer())
//    const filename = `invoice_${Date.now()}.png`
//    // save to /public/invoices/ or your cloud storage (S3, Cloudinary, etc.)
//    fs.writeFileSync(`./public/invoices/${filename}`, buffer)
//    return Response.json({ url: `${process.env.NEXT_PUBLIC_BASE_URL}/invoices/${filename}` })
//  }
// ─────────────────────────────────────────────────────────────────────────────

async function uploadInvoiceImage(blob: Blob, endpoint: string): Promise<string> {
  const form = new FormData()
  form.append("file", blob, `invoice_${Date.now()}.png`)
  const res  = await fetch(endpoint, { method: "POST", body: form })
  const json = await res.json()
  if (!res.ok || !json.url) throw new Error(json.message || "Image upload failed — check your endpoint")
  return json.url as string
}

// ─────────────────────────────────────────────────────────────────────────────
//  STEP 3 — Send via Rhaitech WABA API
//
//  POST https://api.rhaitech.online/api/create-message
//  multipart/form-data:
//    appkey          = your app key
//    authkey         = your auth key
//    to              = receiver phone (digits only, with country code)
//    template_id     = numeric template id
//    language        = en_us
//    file            = public URL of invoice image
//    variables[{k}]  = variable value  (one field per variable)
// ─────────────────────────────────────────────────────────────────────────────

async function sendViaRhaitech({
  to, fileUrl, studentName, amountPaid, balance, cfg,
}: {
  to: string; fileUrl: string; studentName: string
  amountPaid: string; balance: string; cfg: RhaitechConfig
}): Promise<string> {
  const form = new FormData()
  form.append("appkey",      cfg.appkey)
  form.append("authkey",     cfg.authkey)
  form.append("to",          to.replace(/\D/g, ""))    // digits only, e.g. 919876543210
  form.append("template_id", cfg.templateId)
  form.append("language",    cfg.language || "en_us")
  form.append("file",        fileUrl)

  // Variable keys must match EXACTLY the keys defined in your Rhaitech template
  form.append(`variables[${cfg.varKeyName}]`,    studentName)
  form.append(`variables[${cfg.varKeyPaid}]`,    amountPaid)
  form.append(`variables[${cfg.varKeyBalance}]`, balance)

  const res  = await fetch("https://api.rhaitech.online/api/create-message", {
    method: "POST",
    body:   form,
    // No Content-Type header — browser sets multipart boundary automatically
  })
  const json = await res.json()

  // Rhaitech response: { status: true, message: "...", id: "123" }
  if (!res.ok || json.status === false)
    throw new Error(json.message || `Rhaitech error HTTP ${res.status}`)

  return String(json.id ?? json.message_id ?? "sent")
}

// ─────────────────────────────────────────────────────────────────────────────
//  SETTINGS DIALOG
// ─────────────────────────────────────────────────────────────────────────────

function RhaitechSettingsDialog({
  open, onClose, config, onSave,
}: {
  open: boolean; onClose: () => void
  config: RhaitechConfig; onSave: (c: RhaitechConfig) => void
}) {
  const [local, setLocal] = useState<RhaitechConfig>(config)
  useEffect(() => { setLocal(config) }, [config, open])
  const f = (k: keyof RhaitechConfig) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setLocal(p => ({ ...p, [k]: e.target.value }))

  const ready = !!(local.templateId && local.imageUploadEndpoint)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-green-600" />
            Rhaitech WABA — Bulk Sender Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">

          {/* API Credentials */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              API Credentials
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>App Key</Label>
                <Input value={local.appkey} onChange={f("appkey")} placeholder="f67908d5-..." />
              </div>
              <div className="space-y-1.5">
                <Label>Auth Key</Label>
                <Input value={local.authkey} onChange={f("authkey")} type="password" placeholder="ppIYRYOl..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Template ID <span className="text-red-500">*</span></Label>
                  <Input value={local.templateId} onChange={f("templateId")} placeholder="123456" />
                  <p className="text-xs text-muted-foreground">Numeric ID from Rhaitech dashboard</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <Input value={local.language} onChange={f("language")} placeholder="en_us" />
                </div>
              </div>
            </div>
          </div>

          {/* Variable Keys */}
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Template Variable Keys
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-xs text-amber-800">
              <p className="font-semibold mb-1">📋 How to find your variable keys:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Login to Rhaitech → Templates → open your fee receipt template</li>
                <li>Copy each variable key exactly as shown, e.g. <code className="bg-amber-100 px-1 rounded">{"{student_name}"}</code></li>
                <li>Paste them in the fields below — must match character-for-character</li>
              </ol>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Student Name Key</Label>
                <Input value={local.varKeyName} onChange={f("varKeyName")} placeholder="{student_name}" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Amount Paid Key</Label>
                <Input value={local.varKeyPaid} onChange={f("varKeyPaid")} placeholder="{amount_paid}" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Balance Key</Label>
                <Input value={local.varKeyBalance} onChange={f("varKeyBalance")} placeholder="{balance}" className="text-sm" />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Invoice Image Upload Endpoint <span className="text-red-500">*</span>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-xs text-blue-800 space-y-1">
              <p className="font-semibold">ℹ️ Why is this needed?</p>
              <p>
                Rhaitech's <code className="bg-blue-100 px-1 rounded">file</code> field requires a{" "}
                <b>public HTTPS URL</b>. We render the invoice as a PNG and upload it to your server
                first, then pass the URL to Rhaitech.
              </p>
              <p className="font-semibold mt-1">Your endpoint must:</p>
              <code className="block bg-blue-100 rounded px-2 py-1">
                POST multipart/form-data {"{ file: <PNG blob> }"}
              </code>
              <code className="block bg-blue-100 rounded px-2 py-1 mt-1">
                {'→ return JSON: { "url": "https://yourdomain.com/invoices/abc.png" }'}
              </code>
              <p className="mt-1 text-blue-600">
                Add <code className="bg-blue-100 px-1 rounded">app/api/upload-invoice/route.ts</code> to
                your Next.js project (see comments in source code).
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Endpoint URL</Label>
              <Input
                value={local.imageUploadEndpoint}
                onChange={f("imageUploadEndpoint")}
                placeholder="https://yourserver.com/api/upload-invoice"
              />
            </div>
          </div>

          {/* Status indicator */}
          {ready
            ? <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                All set! Ready to send bulk invoices via WhatsApp.
              </div>
            : <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Fill in Template ID and Upload Endpoint to enable bulk sending.
              </div>
          }
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => { onSave(local); onClose() }}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  BULK SENDER DIALOG
// ─────────────────────────────────────────────────────────────────────────────

const WAIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

function BulkSenderDialog({
  open, onClose, invoices, config,
}: {
  open: boolean; onClose: () => void
  invoices: Invoice[]; config: RhaitechConfig
}) {
  const [selected,     setSelected]     = useState<Set<number>>(new Set())
  const [results,      setResults]      = useState<SendResult[]>([])
  const [running,      setRunning]      = useState(false)
  const [step,         setStep]         = useState<"select" | "sending" | "done">("select")
  const [showMissing,  setShowMissing]  = useState(false)
  const abortRef = useRef(false)

  const eligible = invoices.filter(inv => !!inv.student_phone)
  const noPhone  = invoices.filter(inv => !inv.student_phone)

  useEffect(() => {
    if (!open) {
      setStep("select"); setSelected(new Set())
      setResults([]); setRunning(false)
      abortRef.current = false
    }
  }, [open])

  const toggleAll = () =>
    setSelected(p => p.size === eligible.length ? new Set() : new Set(eligible.map(i => i.id)))
  const toggle = (id: number) =>
    setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const setResult = (id: number, u: Partial<SendResult>) =>
    setResults(p => p.map(r => r.invoiceId === id ? { ...r, ...u } : r))

  const handleSend = async () => {
    if (!config.templateId) {
      alert("Template ID missing — open Setup WABA and fill it in."); return
    }
    if (!config.imageUploadEndpoint) {
      alert("Image Upload Endpoint missing — open Setup WABA and fill it in."); return
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
      if (abortRef.current) {
        setResult(inv.id, { status: "failed", error: "Stopped by user" })
        continue
      }
      try {
        // 1. Render → PNG
        setResult(inv.id, { status: "rendering" })
        const blob = await buildInvoiceBlob(inv)

        // 2. Upload PNG → public URL
        setResult(inv.id, { status: "sending" })
        const fileUrl = await uploadInvoiceImage(blob, config.imageUploadEndpoint)

        // 3. Send via Rhaitech
        const paid    = Number(inv.paid_amount)
        const balance = Number(inv.amount) - paid
        const msgId   = await sendViaRhaitech({
          to: inv.student_phone!,
          fileUrl,
          studentName: inv.student_name,
          amountPaid:  fmtINR(paid),
          balance:     fmtINR(balance),
          cfg:         config,
        })
        setResult(inv.id, { status: "success", msgId })
      } catch (err: any) {
        setResult(inv.id, { status: "failed", error: err?.message || "Unknown error" })
      }
      await sleep(500)   // ~2 msg/s — safe rate limit
    }

    setRunning(false)
    setStep("done")
  }

  const counts = {
    success: results.filter(r => r.status === "success").length,
    failed:  results.filter(r => r.status === "failed").length,
    pending: results.filter(r => ["pending","rendering","sending"].includes(r.status)).length,
  }

  const sendBadge = (s: SendStatus) => {
    const cfg: Record<SendStatus, { label: string; cls: string; icon: React.ReactNode }> = {
      idle:      { label: "Idle",      cls: "bg-gray-100 text-gray-600",       icon: <Clock className="h-3 w-3"/> },
      pending:   { label: "Queued",    cls: "bg-blue-100 text-blue-700",       icon: <Clock className="h-3 w-3"/> },
      rendering: { label: "Rendering", cls: "bg-yellow-100 text-yellow-700",   icon: <Loader2 className="h-3 w-3 animate-spin"/> },
      sending:   { label: "Sending",   cls: "bg-purple-100 text-purple-700",   icon: <Loader2 className="h-3 w-3 animate-spin"/> },
      success:   { label: "Sent ✓",    cls: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="h-3 w-3"/> },
      failed:    { label: "Failed",    cls: "bg-red-100 text-red-700",         icon: <XCircle className="h-3 w-3"/> },
    }
    const m = cfg[s]
    return <Badge className={`${m.cls} flex items-center gap-1 text-xs px-2`}>{m.icon}{m.label}</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={running ? undefined : onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden rounded-xl">

        {/* Green header */}
        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-green-500">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
            <WAIcon />
          </div>
          <div>
            <h2 className="text-white font-semibold text-base leading-tight">Bulk WhatsApp Invoice Sender</h2>
            <p className="text-green-100 text-xs">Powered by Rhaitech WABA API</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-6 flex-1 overflow-hidden">

          {/* ── SELECT ─────────────────────────────────────────── */}
          {step === "select" && (
            <>
              {/* Summary pills */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "With Phone",  value: eligible.length, bg: "bg-green-50 border-green-200",  text: "text-green-700",  sub: "text-green-600" },
                  { label: "No Phone",    value: noPhone.length,  bg: "bg-amber-50 border-amber-200",  text: "text-amber-700",  sub: "text-amber-600" },
                  { label: "Selected",    value: selected.size,   bg: "bg-blue-50 border-blue-200",    text: "text-blue-700",   sub: "text-blue-600"  },
                ].map(({ label, value, bg, text, sub }) => (
                  <div key={label} className={`${bg} border rounded-xl p-3 text-center`}>
                    <div className={`text-2xl font-bold ${text}`}>{value}</div>
                    <div className={`text-xs mt-0.5 ${sub}`}>{label}</div>
                  </div>
                ))}
              </div>

              {/* No-phone alert */}
              {noPhone.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{noPhone.length} invoice(s) skipped — no phone number recorded.</span>
                  <button className="underline ml-auto" onClick={() => setShowMissing(v => !v)}>
                    {showMissing ? "Hide" : "Show missing"}
                  </button>
                </div>
              )}

              {/* Select-all row */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="selAll"
                    checked={selected.size === eligible.length && eligible.length > 0}
                    onCheckedChange={toggleAll}
                  />
                  <label htmlFor="selAll" className="text-sm font-medium cursor-pointer select-none">
                    Select all ({eligible.length})
                  </label>
                </div>
                <span className="text-xs text-muted-foreground">{selected.size} selected</span>
              </div>

              {/* Invoice table */}
              <div className="overflow-y-auto flex-1 rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-10 pl-4"></TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(showMissing ? noPhone : eligible).map(inv => {
                      const bal = Number(inv.amount) - Number(inv.paid_amount)
                      const st  = getStatus(inv)
                      const isSel = selected.has(inv.id)
                      return (
                        <TableRow
                          key={inv.id}
                          className={`cursor-pointer transition-colors hover:bg-muted/50 ${isSel ? "bg-green-50" : ""}`}
                          onClick={() => !showMissing && toggle(inv.id)}
                        >
                          <TableCell className="pl-4">
                            {!showMissing && (
                              <Checkbox
                                checked={isSel}
                                onCheckedChange={() => toggle(inv.id)}
                                onClick={e => e.stopPropagation()}
                              />
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-sm">{inv.student_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {inv.student_phone || <span className="text-red-400 text-xs">Missing</span>}
                          </TableCell>
                          <TableCell className="text-sm">₹{fmtINR(Number(inv.amount))}</TableCell>
                          <TableCell className="text-sm text-emerald-600 font-medium">
                            ₹{fmtINR(Number(inv.paid_amount))}
                          </TableCell>
                          <TableCell className={`text-sm font-medium ${bal > 0 ? "text-red-600" : "text-emerald-600"}`}>
                            ₹{fmtINR(bal)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusColor(st)} text-xs`}>{st}</Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {(showMissing ? noPhone : eligible).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                          {showMissing
                            ? "No invoices with missing phone numbers."
                            : "No invoices with phone numbers found. Add phone numbers to students first."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button
                  onClick={handleSend}
                  disabled={selected.size === 0}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send {selected.size > 0 ? `${selected.size} Invoice${selected.size > 1 ? "s" : ""}` : "Invoices"} via WhatsApp
                </Button>
              </DialogFooter>
            </>
          )}

          {/* ── SENDING / DONE ──────────────────────────────────── */}
          {(step === "sending" || step === "done") && (
            <>
              {/* Progress summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Sent",      value: counts.success, bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", sub: "text-emerald-600" },
                  { label: "Failed",    value: counts.failed,  bg: "bg-red-50 border-red-200",         text: "text-red-700",     sub: "text-red-600"     },
                  { label: "Remaining", value: counts.pending, bg: "bg-blue-50 border-blue-200",       text: "text-blue-700",    sub: "text-blue-600"    },
                ].map(({ label, value, bg, text, sub }) => (
                  <div key={label} className={`${bg} border rounded-xl p-3 text-center`}>
                    <div className={`text-2xl font-bold ${text}`}>{value}</div>
                    <div className={`text-xs mt-0.5 ${sub}`}>{label}</div>
                  </div>
                ))}
              </div>

              {step === "sending" && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-700">Sending in progress…</p>
                    <p className="text-xs text-green-600">
                      Rendering PNG → Uploading to server → Posting to Rhaitech WABA API
                    </p>
                  </div>
                  <Button size="sm" variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 shrink-0"
                    onClick={() => { abortRef.current = true }}>
                    Stop
                  </Button>
                </div>
              )}

              {step === "done" && (
                <div className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
                  counts.failed === 0
                    ? "bg-emerald-50 border border-emerald-200"
                    : "bg-amber-50 border border-amber-200"}`}>
                  {counts.failed === 0
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    : <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />}
                  <span className={`text-sm font-semibold ${counts.failed === 0 ? "text-emerald-700" : "text-amber-700"}`}>
                    {counts.failed === 0
                      ? `All ${counts.success} invoices sent successfully!`
                      : `Done — ${counts.success} sent, ${counts.failed} failed`}
                  </span>
                </div>
              )}

              {/* Per-invoice log */}
              <div className="overflow-y-auto flex-1 rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Student</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map(r => (
                      <TableRow key={r.invoiceId}>
                        <TableCell className="font-medium text-sm">{r.studentName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.phone}</TableCell>
                        <TableCell>{sendBadge(r.status)}</TableCell>
                        <TableCell className="text-xs max-w-[220px] truncate">
                          {r.status === "success"   && <span className="text-emerald-600">Msg ID: {r.msgId}</span>}
                          {r.status === "failed"    && <span className="text-red-500" title={r.error}>{r.error}</span>}
                          {r.status === "rendering" && <span className="text-yellow-600">Generating invoice image…</span>}
                          {r.status === "sending"   && <span className="text-purple-600">Uploading &amp; posting to Rhaitech…</span>}
                          {r.status === "pending"   && <span className="text-blue-500">In queue…</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={onClose} disabled={running}>
                  {running ? "Sending…" : "Close"}
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN InvoicesContent
// ─────────────────────────────────────────────────────────────────────────────

export function InvoicesContent() {
  const [invoices,  setInvoices]  = useState<Invoice[]>([])
  const [summary,   setSummary]   = useState<Summary>({ total_invoiced: 0, total_paid: 0, total_pending: 0 })
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [importing, setImporting] = useState(false)
  const [filterStatus,  setFilterStatus]  = useState("all")
  const [studentFilter, setStudentFilter] = useState("")
  const [modalOpen,     setModalOpen]     = useState(false)
  const [viewOpen,      setViewOpen]      = useState(false)
  const [selected,      setSelected]      = useState<Invoice | null>(null)
  const [editing,       setEditing]       = useState<Invoice | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Rhaitech
  const [rhaitechCfg,    setRhaitechCfg]    = useState<RhaitechConfig>(loadCfg)
  const [settingsOpen,   setSettingsOpen]   = useState(false)
  const [bulkSenderOpen, setBulkSenderOpen] = useState(false)

  // Student search
  const [students,        setStudents]        = useState<Student[]>([])
  const [studentSearch,   setStudentSearch]   = useState("")
  const [showDropdown,    setShowDropdown]    = useState(false)
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
    const t = setTimeout(async () => {
      setStudentsLoading(true)
      try {
        const res: any = await studentsApi.getAll({ search: studentSearch })
        setStudents(res.data || []); setShowDropdown(true)
      } catch { setStudents([]) }
      finally { setStudentsLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [studentSearch])

  const pickStudent = (s: Student) => {
    setSelectedStudent(s); setStudentSearch(s.name); setShowDropdown(false)
    const remaining = Number(s.fee) - Number(s.paid_fee)
    setForm(p => ({
      ...p, student_name: s.name, student_id: String(s.id),
      amount: remaining > 0 ? String(remaining) : String(s.fee),
      paid_amount: "0",
      description: `Tuition Fee – ${s.course || s.standard + "th Std"}`,
    }))
  }

  const clearStudent = () => {
    setSelectedStudent(null); setStudentSearch(""); setStudents([]); setShowDropdown(false)
    setForm(p => ({ ...p, student_name: "", student_id: "", amount: "", paid_amount: "", description: "" }))
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
      editing ? await invoicesApi.update(editing.id, payload) : await invoicesApi.create(payload)
      setModalOpen(false); setEditing(null); load()
    } catch (err: any) { alert(err.message) }
    finally { setSaving(false) }
  }

  const openEdit = (inv: Invoice) => {
    setEditing(inv)
    setSelectedStudent({ id: Number(inv.student_id||0), name: inv.student_name||"", phone: "", standard: inv.standard||"", course: inv.course||"", location: "", fee: Number(inv.amount||0), paid_fee: Number(inv.paid_amount||0), father_name: "" })
    setStudentSearch(inv.student_name||""); setShowDropdown(false)
    setForm({
      student_name: inv.student_name||"", student_id: inv.student_id||"",
      amount: String(inv.amount??""), paid_amount: String(inv.paid_amount??0),
      due_date: inv.due_date?new Date(inv.due_date).toISOString().split("T")[0]:"",
      install_date: inv.install_date?new Date(inv.install_date).toISOString().split("T")[0]:"",
      transaction_type: inv.transaction_type||"Cash", description: inv.description||"",
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this invoice?")) return
    try { await invoicesApi.remove(id); load() } catch (err: any) { alert(err.message) }
  }

  const handleExportExcel = () => {
    if (!invoices.length) { alert("No invoices to export"); return }
    const headers = ["Invoice ID","Student Name","Student ID","Amount","Paid Amount","Balance","Install Date","Due Date","Transaction Type","Status","Description"]
    const rows = invoices.map(inv => {
      const amount=Number(inv.amount||0), paid=Number(inv.paid_amount||0)
      return [`INV${String(inv.id).padStart(3,"0")}`,inv.student_name||"",inv.student_id||"",amount,paid,amount-paid,
        inv.install_date?new Date(inv.install_date).toLocaleDateString("en-CA"):"",
        inv.due_date?new Date(inv.due_date).toLocaleDateString("en-CA"):"",
        inv.transaction_type||"",getStatus(inv),inv.description||""]
    })
    const esc = (v: string|number) => `"${String(v).replace(/"/g,'""')}"`
    const csv = [headers,...rows].map(r=>r.map(esc).join(",")).join("\n")
    const a = Object.assign(document.createElement("a"),{
      href: URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"})),
      download: `invoices_${new Date().toISOString().slice(0,10)}.csv`,
    })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  const downloadTemplate = () => {
    const csv=[["student_name","amount","paid_amount","install_date","due_date","transaction_type","description"],
      ["John Doe","5000","2000","2024-01-15","2024-02-15","Cash","Tuition Fee – January"]]
      .map(r=>r.map(v=>`"${v}"`).join(",")).join("\n")
    const a=Object.assign(document.createElement("a"),{
      href:URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"})),
      download:"invoice_import_template.csv",
    })
    document.body.appendChild(a);a.click();document.body.removeChild(a)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0];if(!file)return
    setImporting(true)
    try {
      const [,,  ...rows]=(await file.text()).split(/\r?\n/).filter(l=>l.trim())
      let ok=0,fail=0
      for(const row of rows){
        const cols=row.match(/("(?:[^"]|"")*"|[^,]*)/g)?.map(c=>c.replace(/^"|"$/g,"").replace(/""/g,'"').trim())??[]
        const [student_name,amount,paid_amount,install_date,due_date,transaction_type,description]=cols
        if(!student_name||!amount||!due_date){fail++;continue}
        try{await invoicesApi.create({student_name,amount:parseFloat(amount)||0,paid_amount:parseFloat(paid_amount)||0,install_date:install_date||undefined,due_date,transaction_type:transaction_type||"Cash",description:description||""});ok++}
        catch{fail++}
      }
      alert(`Import complete: ${ok} imported, ${fail} failed.`);load()
    }catch{alert("Failed to read file.")}
    finally{setImporting(false);if(fileInputRef.current)fileInputRef.current.value=""}
  }

  const handlePrint = (inv: Invoice) => {
    const w=window.open("","_blank");if(!w)return
    const balance=Number(inv.amount)-Number(inv.paid_amount)
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt #${inv.id}</title><style>@page{size:A4;margin:25mm}body{font-family:Arial,sans-serif;color:#333;margin:0}.header{display:flex;justify-content:space-between}.title{text-align:center;font-size:22px;color:#1f7fa6;font-weight:bold;margin:15px 0;padding-top:10px;border-top:2px solid #1f7fa6}.content{display:flex;justify-content:space-between;margin-top:25px}.col{width:48%}.label{font-weight:bold;margin-top:10px}.text{margin-top:4px}.rd{text-align:right;font-size:14px;margin-bottom:15px}.tbl{width:100%;border-collapse:collapse}.tbl td{padding:6px 0;font-size:14px}.tbl td:last-child{text-align:right;font-weight:bold}.bal{border-top:1px solid #999;padding-top:6px}.sig{margin-top:70px;text-align:right}.auth{font-weight:bold;margin-top:6px}</style></head><body><div class="header"><div><h2 style="margin:0;font-size:20px">DNYANSAGAR CLASSES</h2><p style="margin:2px 0;font-size:13px">201/A, New Excelsior Building Opp. Crown Hotel, KHADKI Pune - 411003</p><p style="margin:2px 0;font-size:13px">Phone: 8862010906 | Maharashtra</p></div><img style="width:70px" src="/logo.jpeg"/></div><div class="title">Payment Receipt</div><div class="content"><div class="col"><div class="label">Received From</div><div class="text">${inv.student_name}</div><div class="text">Contact: ${inv.student_phone||"-"}</div><div class="label">Amount in words</div><div class="text">${fmtINR(Number(inv.paid_amount))} Rupees only</div></div><div class="col"><div class="rd"><b>Receipt No:</b> ${inv.id}<br/><b>Date:</b> ${fmtDate(inv.install_date)}</div><table class="tbl"><tr><td>Received</td><td>₹${fmtINR(Number(inv.paid_amount))}</td></tr><tr><td>Payment mode</td><td>${inv.transaction_type||"Online"}</td></tr><tr><td>Previous Balance</td><td>₹${fmtINR(Number(inv.amount))}</td></tr><tr class="bal"><td>Current Balance</td><td>₹${fmtINR(balance)}</td></tr></table></div></div><div class="sig"><div>For: DNYANSAGAR CLASSES</div><img src="${window.location.origin}/sign.jpeg" style="height:60px;margin:8px 0;display:block;margin-left:auto"/><div class="auth">Authorized Signatory</div></div></body></html>`)
    w.document.close();w.print()
  }

  const handleInvoicePrint = (inv: Invoice|null) => {
    if(!inv)return
    const w=window.open("","_blank");if(!w)return
    const balance=Number(inv.amount)-Number(inv.paid_amount)
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice #${inv.id}</title><style>@page{size:A4;margin:20mm}body{font-family:Arial,sans-serif;margin:0;color:#333}.hdr{display:flex;justify-content:space-between;border-bottom:2px solid #1f7fa6;padding-bottom:10px}.title{text-align:center;color:#1f7fa6;font-size:22px;font-weight:bold;margin:15px 0}.tbl{width:100%;border-collapse:collapse;margin-top:15px}.tbl th,.tbl td{padding:8px;font-size:14px}.tbl td{border-bottom:1px solid #ddd}.tbl td:last-child,.tbl th:last-child{text-align:right}.sum{display:flex;justify-content:space-between;margin-top:20px}.rs{width:40%}.rs table{width:100%;font-size:14px}.rs td{padding:6px 0}.rs td:last-child{text-align:right}.tot{font-weight:bold}.ft{display:flex;justify-content:space-between;margin-top:40px}.sig{text-align:right}.auth{font-weight:bold;margin-top:5px}</style></head><body><div class="hdr"><div><h2 style="margin:0;font-size:20px">DNYANSAGAR CLASSES</h2><p style="margin:2px 0;font-size:13px">201/A, New Excelsior Building Opp. Crown Hotel, KHADKI Pune - 411003</p><p style="margin:2px 0;font-size:13px">Phone: 8862010906 | Maharashtra</p></div><img style="width:70px" src="${window.location.origin}/logo.jpeg"/></div><div class="title">Tax Invoice</div><p><b>Invoice No:</b> ${inv.id} | <b>Date:</b> ${fmtDate(inv.install_date)}</p><p><b>Name:</b> ${inv.student_name} | <b>ID:</b> ${inv.student_id||"-"} | <b>Std:</b> ${inv.standard||"-"} | <b>Course:</b> ${inv.course||"-"}</p><table class="tbl"><thead><tr><th>Description</th><th>Course</th><th>Transaction</th><th>Paid Date</th><th>Due Date</th><th>Amount</th></tr></thead><tbody><tr><td>${inv.description||"Course Fee"}</td><td>${inv.course||"-"}</td><td>${inv.transaction_type||"Cash"}</td><td>${fmtDate(inv.install_date)}</td><td>${fmtDate(inv.due_date)}</td><td>₹${fmtINR(Number(inv.amount))}</td></tr><tr class="tot"><td colspan="5">TOTAL</td><td>₹${fmtINR(Number(inv.amount))}</td></tr></tbody></table><div class="sum"><div style="width:55%;font-size:14px">${fmtINR(Number(inv.amount))} Rupees only<br/><br/><b>Terms:</b> FEES ONCE PAID WILL NOT BE REFUNDED.<br/>Thank You! — DNYANSAGAR CLASSES</div><div class="rs"><table><tr><td>Sub Total</td><td>₹${fmtINR(Number(inv.amount))}</td></tr><tr class="tot"><td>Total</td><td>₹${fmtINR(Number(inv.amount))}</td></tr><tr><td>Received</td><td>₹${fmtINR(Number(inv.paid_amount))}</td></tr><tr><td>Balance</td><td>₹${fmtINR(balance)}</td></tr><tr><td>Mode</td><td>${inv.transaction_type||"Online"}</td></tr></table></div></div><div class="ft"><div style="font-size:13px"><img style="width:90px" src="${window.location.origin}/qr.png"/><br/><b>Pay To:</b><br/>Bank: HDFC BANK | A/C: 50200066917533<br/>IFSC: HDFC0001791 | Vidyaaniketan Professional Academy</div><div class="sig"><div>For: Vidyaaniketan Professional Academy</div><img src="${window.location.origin}/sign.jpeg" style="height:40px"/><div class="auth">Authorized Signatory</div></div></div></body></html>`)
    w.document.close();w.print()
  }

  const handleWhatsAppShare = (inv: Invoice) => {
    const paid=Number(inv.paid_amount||0), balance=Number(inv.amount||0)-paid
    const msg=[
      "Greetings from DNYANSAGAR CLASSES,","",
      "Thank you for being a part of our institute. Please find the details of your fee payment below.","",
      "📘 *Fee Payment Details*","",
      `👨‍🎓 *Student Name:* ${inv.student_name||"-"}`,
      `💰 *Amount Paid:* ₹${fmtINR(paid)}`,
      `📌 *Balance:* ₹${fmtINR(balance)}`,"",
      "✅ Your payment has been received successfully. We appreciate your trust in us and wish you success in your studies.","",
      "Regards,","DNYANSAGAR CLASSES",
    ].join("\n")
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank","noopener,noreferrer")
  }

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const filteredInvoices = invoices.filter(inv =>
    inv.student_name?.toLowerCase().includes(studentFilter.trim().toLowerCase())
  )
  const cfgReady = !!(rhaitechCfg.templateId && rhaitechCfg.imageUploadEndpoint)

  return (
    <div className="space-y-6 pt-12 lg:pt-0">

      {/* Dialogs */}
      <RhaitechSettingsDialog
        open={settingsOpen} onClose={() => setSettingsOpen(false)}
        config={rhaitechCfg} onSave={cfg => { setRhaitechCfg(cfg); saveCfg(cfg) }}
      />
      <BulkSenderDialog
        open={bulkSenderOpen} onClose={() => setBulkSenderOpen(false)}
        invoices={filteredInvoices} config={rhaitechCfg}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Invoiced",  value: summary.total_invoiced,  cls: "from-blue-500 to-blue-600" },
          { label: "Total Collected", value: summary.total_paid,      cls: "from-emerald-500 to-emerald-600" },
          { label: "Pending Amount",  value: summary.total_pending,   cls: "from-amber-500 to-amber-600" },
        ].map(({ label, value, cls }) => (
          <Card key={label} className={`bg-gradient-to-br ${cls} text-white border-0`}>
            <CardContent className="p-4">
              <p className="text-sm opacity-90">{label}</p>
              <p className="text-2xl font-bold">₹{Number(value||0).toLocaleString()}</p>
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
            <div className="relative w-full sm:w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input value={studentFilter} onChange={e=>setStudentFilter(e.target.value)} placeholder="Search student…" className="pl-9"/>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue/></SelectTrigger>
              <SelectContent>
                {["all","Paid","Partial","Pending","Overdue"].map(s=>(
                  <SelectItem key={s} value={s}>{s==="all"?"All Status":s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleExportExcel} variant="outline"><FileSpreadsheet className="h-4 w-4 mr-2"/>Export</Button>
            <Button onClick={downloadTemplate} variant="outline"><Download className="h-4 w-4 mr-2"/>Template</Button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport}/>
            <Button onClick={()=>fileInputRef.current?.click()} variant="outline" disabled={importing} className="border-violet-300 text-violet-700 hover:bg-violet-50">
              {importing?<Loader2 className="h-4 w-4 mr-2 animate-spin"/>:<Upload className="h-4 w-4 mr-2"/>}
              {importing?"Importing…":"Import CSV"}
            </Button>

            {/* ── WABA Settings button ── */}
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(true)}
              className={cfgReady
                ? "border-green-300 text-green-700 hover:bg-green-50"
                : "border-amber-300 text-amber-700 hover:bg-amber-50"}
            >
              <Settings2 className="h-4 w-4 mr-1.5"/>
              {cfgReady ? "WABA ✓" : "Setup WABA"}
            </Button>

            {/* ── Bulk Send button ── */}
            <Button
              onClick={() => cfgReady ? setBulkSenderOpen(true) : setSettingsOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <span className="text-white mr-1.5"><WAIcon/></span>
              <Zap className="h-3.5 w-3.5 mr-1"/>
              Bulk Send
            </Button>

            <Button onClick={openModal} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2"/>New Invoice
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-900">
                    {["ID","Student","Amount","Paid","Paid Date","Due Date","Status","Actions"].map((h,i)=>(
                      <TableHead key={h} className={`text-white font-semibold${
                        i===2?" hidden sm:table-cell":i===3?" hidden md:table-cell":
                        (i===4||i===5)?" hidden lg:table-cell":i===7?" text-center":""}`}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length===0?(
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No invoices found</TableCell></TableRow>
                  ):filteredInvoices.map(inv=>{
                    const st=getStatus(inv)
                    return(
                      <TableRow key={inv.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">INV{String(inv.id).padStart(3,"0")}</TableCell>
                        <TableCell>{inv.student_name}</TableCell>
                        <TableCell className="hidden sm:table-cell">₹{Number(inv.amount).toLocaleString()}</TableCell>
                        <TableCell className="hidden md:table-cell">₹{Number(inv.paid_amount).toLocaleString()}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{fmtDate(inv.install_date)}</TableCell>
                        <TableCell className="hidden lg:table-cell">{fmtDate(inv.due_date)}</TableCell>
                        <TableCell>
                          <Badge className={`${statusColor(st)} flex items-center gap-1 w-fit`}>
                            {statusIcon(st)}{st}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={()=>{setSelected(inv);setViewOpen(true)}}><Eye className="h-4 w-4"/></Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={()=>openEdit(inv)}><Edit2 className="h-4 w-4"/></Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={()=>handlePrint(inv)}><Printer className="h-4 w-4"/></Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:border-green-300" onClick={()=>handleWhatsAppShare(inv)}><MessageCircle className="h-4 w-4"/></Button>
                            <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={()=>handleDelete(inv.id)}><Trash2 className="h-4 w-4"/></Button>
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

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing?"Edit Invoice":"Create New Invoice"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Student <span className="text-destructive">*</span></Label>
              {selectedStudent?(
                <div className="flex items-start justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm text-emerald-800">{selectedStudent.name}</p>
                    <p className="text-xs text-emerald-600">{selectedStudent.standard&&`Std ${selectedStudent.standard}`}{selectedStudent.course&&` · ${selectedStudent.course}`}</p>
                    <p className="text-xs text-emerald-600">📞 {selectedStudent.phone}{selectedStudent.fee>0&&<span className="ml-2">· Balance: ₹{(Number(selectedStudent.fee)-Number(selectedStudent.paid_fee)).toLocaleString()}</span>}</p>
                  </div>
                  <button onClick={clearStudent} className="text-emerald-500 hover:text-red-500 ml-2 mt-0.5"><X className="h-4 w-4"/></button>
                </div>
              ):(
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input placeholder="Search student by name or phone…" value={studentSearch} onChange={e=>setStudentSearch(e.target.value)} onFocus={()=>{if(students.length>0)setShowDropdown(true)}} className="pl-9 pr-9"/>
                    {studentsLoading&&<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground"/>}
                    {studentSearch&&!studentsLoading&&<button onClick={clearStudent} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4"/></button>}
                  </div>
                  {showDropdown&&students.length>0&&(
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                      {students.map(s=>(
                        <button key={s.id} onClick={()=>pickStudent(s)} className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted text-left border-b border-border/50 last:border-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">{s.name.charAt(0).toUpperCase()}</div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{[s.standard&&`Std ${s.standard}`,s.course,s.phone].filter(Boolean).join(" · ")}</p>
                            {s.fee>0&&<p className="text-xs text-amber-600 font-medium">Balance: ₹{(Number(s.fee)-Number(s.paid_fee)).toLocaleString()}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showDropdown&&students.length===0&&studentSearch.length>0&&!studentsLoading&&(
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg px-4 py-3 text-sm text-muted-foreground">No students found for "{studentSearch}"</div>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Amount (₹) <span className="text-destructive">*</span></Label><Input type="number" value={form.amount} onChange={e=>f("amount",e.target.value)} placeholder="Total fee"/></div>
              <div className="space-y-2"><Label>Paid (₹)</Label><Input type="number" value={form.paid_amount} onChange={e=>f("paid_amount",e.target.value)} placeholder="Amount paid"/></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Paid Date</Label><Input type="date" value={form.install_date} onChange={e=>f("install_date",e.target.value)}/></div>
              <div className="space-y-2">
                <Label>Transaction Type <span className="text-destructive">*</span></Label>
                <Select value={form.transaction_type} onValueChange={v=>f("transaction_type",v)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="Cash">💵 Cash</SelectItem><SelectItem value="Online">🌐 Online</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Due Date <span className="text-destructive">*</span></Label><Input type="date" value={form.due_date} onChange={e=>f("due_date",e.target.value)}/></div>
            <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={e=>f("description",e.target.value)} placeholder="e.g. Tuition Fee – January"/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving&&<Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
              {editing?"Update Invoice":"Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Invoice Details</DialogTitle></DialogHeader>
          <button onClick={()=>handleInvoicePrint(selected)} className="text-sm text-blue-600 underline text-left">Download invoice</button>
          {selected&&(()=>{
            const st=getStatus(selected)
            return(
              <div className="space-y-3">
                <div className="text-center pb-4 border-b">
                  <h3 className="text-lg font-bold text-blue-600">DNYANSAGAR CLASSES</h3>
                  <p className="text-muted-foreground">Invoice #INV{String(selected.id).padStart(3,"0")}</p>
                </div>
                {([["Student",selected.student_name],["Description",selected.description],["Transaction Type",selected.transaction_type],["Paid Date",fmtDate(selected.install_date)],["Due Date",fmtDate(selected.due_date)],["Total",`₹${Number(selected.amount).toLocaleString()}`],["Paid",`₹${Number(selected.paid_amount).toLocaleString()}`],["Balance",`₹${(Number(selected.amount)-Number(selected.paid_amount)).toLocaleString()}`]] as [string,string|undefined][]).map(([l,v])=>(
                  <div key={l} className="flex justify-between">
                    <span className="text-muted-foreground">{l}:</span>
                    <span className="font-medium">{v??"—"}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={statusColor(st)}>{st}</Badge>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}