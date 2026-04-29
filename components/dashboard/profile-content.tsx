"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { User, Mail, Building, MapPin, Save, Loader2 } from "lucide-react"
import { profileApi } from "@/lib/api"

interface AdminProfile { name: string; email: string; institute: string; address: string }

export function ProfileContent() {
  const [profile, setProfile] = useState<AdminProfile>({ name:"", email:"", institute:"", address:"" })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    profileApi.get().then((res: any) => {
      const d = res.data
      setProfile({ name: d.name||"", email: d.email||"", institute: d.institute||"", address: d.address||"" })
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleUpdate = async () => {
    setSaving(true); setMsg(null)
    try {
      await profileApi.update(profile)
      setMsg({ text: "Profile updated successfully!", ok: true })
    } catch (err: any) {
      setMsg({ text: err.message || "Update failed", ok: false })
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(null), 3000)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-100 p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0 rounded-2xl bg-white/80 backdrop-blur-lg">
        <CardHeader className="sticky top-0 z-10 bg-white/70 backdrop-blur-md border-b rounded-t-2xl">
          <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-gray-800">
            <User className="h-7 w-7 text-blue-600" /> Admin Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {profile.name.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="absolute inset-0 rounded-full blur-md bg-blue-400 opacity-30" />
            </div>
          </div>

          {msg && (
            <div className={`p-3 rounded-lg text-sm text-center ${msg.ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {msg.text}
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4 text-blue-500" /> Full Name
              </Label>
              <Input id="name" value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                placeholder="Enter your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-gray-700">
                <Mail className="h-4 w-4 text-blue-500" /> Email Address
              </Label>
              <Input id="email" type="email" value={profile.email}
                onChange={e => setProfile({ ...profile, email: e.target.value })}
                placeholder="Enter your email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institute" className="flex items-center gap-2 text-gray-700">
                <Building className="h-4 w-4 text-blue-500" /> Institute Name
              </Label>
              <Input id="institute" value={profile.institute}
                onChange={e => setProfile({ ...profile, institute: e.target.value })}
                placeholder="Institute name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4 text-blue-500" /> Institute Address
              </Label>
              <Textarea id="address" value={profile.address} rows={3}
                onChange={e => setProfile({ ...profile, address: e.target.value })}
                placeholder="Institute address" />
            </div>
          </div>

          <Button onClick={handleUpdate} disabled={saving}
            className="w-full py-3 text-lg bg-gradient-to-r from-blue-500 to-blue-700 hover:scale-[1.02] transition-all shadow-lg">
            {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
            {saving ? "Saving…" : "Update Profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
