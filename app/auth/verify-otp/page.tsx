"use client"

import type React from "react"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/hooks/use-auth"

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background flex items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  )
}

function VerifyOtpContent() {
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get("email") || ""
  const { verifyOtp, resendOtp } = useAuth()
  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("Email is required")
      return
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit verification code")
      return
    }

    setLoading(true)
    try {
      await verifyOtp(email.trim(), otp)
    } catch (err: any) {
      setError(err.message || "Could not verify your code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError("")

    if (!email.trim()) {
      setError("Email is required")
      return
    }

    setResending(true)
    try {
      await resendOtp(email.trim())
    } catch (err: any) {
      setError(err.message || "Could not send another code. Please try again.")
    } finally {
      setResending(false)
    }
  }

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-agri-50 via-maize-50 to-agri-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/auth/login" className="inline-flex items-center text-agri-600 hover:text-agri-700 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Link>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center">Verify your email</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoComplete="one-time-code"
                  required
                  className="h-12 text-center text-xl tracking-[0.25em]"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-agri-500 to-maize-500 hover:from-agri-600 hover:to-maize-600"
              >
                {loading ? "Verifying..." : "Verify email"}
              </Button>
            </form>

            <Button
              type="button"
              variant="ghost"
              disabled={resending}
              onClick={handleResend}
              className="mt-3 w-full"
            >
              {resending ? "Sending..." : "Send another code"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
