"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  onLoginClick: () => void
  onSignupClick: () => void
}

export function Navbar({ onLoginClick, onSignupClick }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-card/80 backdrop-blur-md border-b border-border">
      <h2 className="text-2xl font-bold text-primary">InstituteMS</h2>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-6">
        <Link
          href="#about"
          className="text-foreground/80 hover:text-primary transition-colors"
        >
          About
        </Link>
        <Link
          href="#features"
          className="text-foreground/80 hover:text-primary transition-colors"
        >
          Features
        </Link>
        <Link
          href="#pricing"
          className="text-foreground/80 hover:text-primary transition-colors"
        >
          Pricing
        </Link>
        <Button variant="ghost" onClick={onLoginClick}>
          Login
        </Button>
        <Button onClick={onSignupClick}>Signup</Button>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-foreground"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-card border-b border-border md:hidden">
          <div className="flex flex-col p-4 gap-4">
            <Link
              href="#about"
              className="text-foreground/80 hover:text-primary transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="#features"
              className="text-foreground/80 hover:text-primary transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-foreground/80 hover:text-primary transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Button
              variant="ghost"
              onClick={() => {
                onLoginClick()
                setIsMobileMenuOpen(false)
              }}
              className="justify-start"
            >
              Login
            </Button>
            <Button
              onClick={() => {
                onSignupClick()
                setIsMobileMenuOpen(false)
              }}
            >
              Signup
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
