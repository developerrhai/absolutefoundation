"use client"

import Link from "next/link"
import { Facebook, Linkedin, Mail, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-background border-t border-border mt-12">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-primary mb-4">InstituteMS</h3>
            <p className="text-muted-foreground">
              Complete management solution for educational institutes.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="#about"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                About
              </Link>
              <Link
                href="#features"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Pricing
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="flex flex-col gap-2 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>support@institutems.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Pune, India</span>
              </div>
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow</h3>
            <div className="flex flex-col gap-2">
              <Link
                href="#"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="w-4 h-4" />
                <span>Facebook</span>
              </Link>
              <Link
                href="#"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>© 2026 InstituteMS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
