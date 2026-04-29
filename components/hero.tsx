"use client"

import { Button } from "@/components/ui/button"

interface HeroProps {
  onGetStarted: () => void
  onLogin: () => void
}

export function Hero({ onGetStarted, onLogin }: HeroProps) {
  return (
    <section className="text-center py-24 md:py-32 px-6">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Institute Management System
        </span>
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
        Manage students, admissions, fees, staff, and reports in one powerful
        platform.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          size="lg"
          onClick={onGetStarted}
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold px-8"
        >
          Get Started
        </Button>
        <Button size="lg" variant="outline" onClick={onLogin}>
          Login
        </Button>
      </div>
    </section>
  )
}
