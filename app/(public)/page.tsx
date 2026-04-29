"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { About } from "@/components/about"
import { Features } from "@/components/features"
import { Pricing } from "@/components/pricing"
import { Footer } from "@/components/footer"
import { AuthModal } from "@/components/auth-modal"


export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")

  const openLogin = () => {
    setAuthMode("login")
    setIsAuthModalOpen(true)
  }

  const openSignup = () => {
    setAuthMode("signup")
    setIsAuthModalOpen(true)
  }

  return (
    <main className="min-h-screen">
      <Navbar onLoginClick={openLogin} onSignupClick={openSignup} />
      <Hero onGetStarted={openSignup} onLogin={openLogin} />
      <About />
      <Features />
      <Pricing />
      <Footer />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
      />
    </main>
  )
}
