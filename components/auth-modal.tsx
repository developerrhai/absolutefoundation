"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { setToken } from "@/lib/api"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "login" | "signup"
  onSwitchMode?: (mode: "login" | "signup") => void
}

export function AuthModal({
  isOpen,
  onClose,
  mode,
  onSwitchMode,
}: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "teacher", // ✅ added role
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/signup"

      const body =
        mode === "login"
          ? { email: formData.email, password: formData.password }
          : formData

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)

        if (mode === "login") {
           const loggedInUser = data.user || data.admin
          if (data.token) {
            setToken(data.token)
            // localStorage.setItem("userInfo", JSON.stringify(data.user))
              localStorage.setItem("userInfo", JSON.stringify(loggedInUser))
          }

          // ✅ Role-based redirect
          setTimeout(() => {
            // if (data.user.role === "admin") {
            //   window.location.href = "/admin/dashboard"
            // } else {
            //   window.location.href = "/teacher/dashboard"
            // }
               const userRole = String(loggedInUser?.role || "").toLowerCase()
            window.location.href =
              userRole === "admin" ? "/dashboard" : "/teacherdashboard"
          }, 1200)
        } else {
          // Auto login after signup, then redirect by role
          const signupEmail = formData.email
          const signupPassword = formData.password
          const selectedRole = String(formData.role || "teacher").toLowerCase()

          try {
            const loginResponse = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: signupEmail,
                password: signupPassword,
              }),
            })

            const loginData = await loginResponse.json()
            if (loginData?.success && loginData?.token) {
              const loggedInUser = loginData.user || loginData.admin
              setToken(loginData.token)
              localStorage.setItem("userInfo", JSON.stringify(loggedInUser))

              setTimeout(() => {
                const userRole = String(loggedInUser?.role || selectedRole).toLowerCase()
                window.location.href =
                  userRole === "admin" ? "/dashboard" : "/teacherdashboard"
              }, 1200)
              return
            }
          } catch {
            // Fallback below: show login form if auto-login fails
          }

          // Fallback to login mode when backend does not support immediate signin
          setFormData({
            name: "",
            email: "",
            password: "",
            role: "teacher",
          })

          // ✅ Switch to login
          setTimeout(() => {
            onSwitchMode?.("login")
          }, 1200)
        }
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-6">
          {mode === "login" ? "Login" : "Create Account"}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name (Signup only) */}
          {mode === "signup" && (
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                name="name"
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
            />
          </div>

          {/* Role (Signup only) */}
          {mode === "signup" && (
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                name="role"
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    role: e.target.value,
                  }))
                }
                className="w-full p-2 rounded-md bg-input border border-border"
              >
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          {/* Error / Success */}
          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}
          {success && (
            <p className="text-green-500 text-sm text-center">{success}</p>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner className="w-4 h-4" />
                {mode === "login" ? "Logging in..." : "Creating account..."}
              </span>
            ) : mode === "login" ? (
              "Login"
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        {/* Switch Mode */}
        <p className="text-sm text-center mt-4">
          {mode === "login" ? (
            <>
              Don’t have an account?{" "}
              <span
                className="text-primary cursor-pointer"
                onClick={() => onSwitchMode?.("signup")}
              >
                Sign up
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span
                className="text-primary cursor-pointer"
                onClick={() => onSwitchMode?.("login")}
              >
                Login
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  )
}