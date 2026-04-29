"use client"

import {
  GraduationCap,
  Users,
  CreditCard,
  UserPlus,
  BarChart3,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: GraduationCap,
    title: "Student Management",
    description: "Track student records, attendance, and academic performance.",
  },
  {
    icon: Users,
    title: "Staff Management",
    description: "Manage faculty information, schedules, and assignments.",
  },
  {
    icon: CreditCard,
    title: "Fee Management",
    description: "Handle fee collection, receipts, and payment tracking.",
  },
  {
    icon: UserPlus,
    title: "Admissions",
    description: "Streamline the admission process with digital forms.",
  },
  {
    icon: BarChart3,
    title: "Reports",
    description: "Generate comprehensive reports and analytics.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="bg-card/50 border-border hover:border-primary/50 transition-colors"
            >
              <CardContent className="pt-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
