"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Users, Video, IndianRupee } from "lucide-react"
import { dashboardApi } from "@/lib/api"
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from "recharts"

const COLORS = ["#22c55e","#ef4444","#3b82f6","#f59e0b","#8b5cf6","#ec4899"]

export function DashboardContent() {
  const [stats,      setStats]      = useState({ students:0, teachers:0, revenue:0, live_classes:5 })
  const [payment,    setPayment]    = useState<{name:string;value:number}[]>([])
  const [byStd,      setByStd]      = useState<{name:string;count:number}[]>([])
  const [byLoc,      setByLoc]      = useState<{name:string;count:number}[]>([])
  const [feeColl,    setFeeColl]    = useState<{month:string;collected:number;pending:number}[]>([])
  const [finance,    setFinance]    = useState<{month:string;income:number;expense:number;profit:number}[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, p, std, loc, fee, fin] = await Promise.all([
          dashboardApi.stats()              as any,
          dashboardApi.paymentStatus()      as any,
          dashboardApi.studentsByStandard() as any,
          dashboardApi.studentsByLocation() as any,
          dashboardApi.feeCollection()      as any,
          dashboardApi.financeOverview()    as any,
        ])

        setStats(s.data)
        setPayment([
          { name: "Paid",    value: Number(p.data.paid)    || 0 },
          { name: "Pending", value: Number(p.data.pending) || 0 },
        ])
        setByStd(std.data.map((r:any) => ({ name: `Std ${r.name}`, count: Number(r.count) })))
        setByLoc(loc.data.map((r:any) => ({ name: r.name,           count: Number(r.count) })))
        setFeeColl(fee.data.map((r:any) => ({
          month:     r.month,
          collected: Number(r.collected) || 0,
          pending:   Number(r.pending)   || 0,
        })))
        setFinance(fin.data.map((r:any) => ({
          month:   r.month,
          income:  Number(r.income)  || 0,
          expense: Number(r.expense) || 0,
          profit:  Number(r.profit)  || 0,
        })))
      } catch (err) {
        console.error("Dashboard load error:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Institute CRM Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm opacity-90">Students</p><p className="text-3xl font-bold">{stats.students}</p></div>
              <GraduationCap className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm opacity-90">Teachers</p><p className="text-3xl font-bold">{stats.teachers}</p></div>
              <Users className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm opacity-90">Live Classes</p><p className="text-3xl font-bold">{stats.live_classes}</p></div>
              <Video className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm opacity-90">Revenue</p><p className="text-3xl font-bold">₹{Number(stats.revenue).toLocaleString()}</p></div>
              <IndianRupee className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Payment Status */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Payment Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={payment} cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                    paddingAngle={5} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                    {payment.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Students by Standard */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Students by Standard</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byStd}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Students by Location */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Students by Location</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byLoc} cx="50%" cy="50%" outerRadius={80} dataKey="count"
                    label={({ name }) => name}>
                    {byLoc.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fee Collection */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Fee Collection</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feeColl}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="collected" fill="#22c55e" name="Collected" radius={[4,4,0,0]} />
                  <Bar dataKey="pending"   fill="#ef4444" name="Pending"   radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Finance Overview */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Finance Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={finance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="income"  stroke="#22c55e" strokeWidth={2} name="Income" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expense" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Profit / Loss */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Profit / Loss</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="profit" fill="#3b82f6" radius={[4,4,0,0]} name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
