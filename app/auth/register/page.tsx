"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Leaf, Eye, EyeOff, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"

const kenyanCounties = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
]

// Add password validation function at the top of the component
const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return "Password must be at least 8 characters long"
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return "Password must contain at least one lowercase letter"
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return "Password must contain at least one uppercase letter"
  }

  if (!/(?=.*\d)/.test(password)) {
    return "Password must contain at least one number"
  }

  return null
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    county: "",
    subCounty: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { register } = useAuth()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Update the handleSubmit function validation section:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation
    if (!formData.fullName.trim()) {
      setError("Full name is required")
      setLoading(false)
      return
    }

    if (!formData.county) {
      setError("County is required")
      setLoading(false)
      return
    }

    if (!formData.subCounty.trim()) {
      setError("Sub County is required")
      setLoading(false)
      return
    }

    if (!formData.password) {
      setError("Password is required")
      setLoading(false)
      return
    }

    // Enhanced password validation
    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      setError(passwordError)
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        county: formData.county,
        subCounty: formData.subCounty.trim(),
        password: formData.password,
      })
      router.push("/dashboard")
    } catch (err: any) {
      // Better error handling for API validation errors
      let errorMessage = err.message || "Registration failed"

      // Clean up common validation error messages
      if (errorMessage.includes("fails to match the required pattern")) {
        errorMessage = "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-agri-50 via-maize-50 to-agri-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-agri-600 hover:text-agri-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-agri-500 to-maize-500 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-agri-600 to-maize-600 bg-clip-text text-transparent">
              Farm Mall
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join thousands of farmers revolutionizing agriculture</p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <form 
              onSubmit={handleSubmit} 
              className="space-y-4" 
              autoComplete="off"
              spellCheck="false"
            >
              {/* Hidden fields to prevent autofill */}
              <input type="text" style={{ display: 'none' }} aria-hidden="true" />
              <input type="password" style={{ display: 'none' }} aria-hidden="true" />
              
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Tonny Bett"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="h-12"
                  autoComplete="off"
                  data-lpignore="true"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="h-12"
                  autoComplete="off"
                  data-lpignore="true"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+254711000000"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="h-12"
                  autoComplete="off"
                  data-lpignore="true"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="county">
                  County <span className="text-red-500">*</span>
                </Label>
                <Select
                  name="county"
                  value={formData.county}
                  onValueChange={(value) => handleSelectChange("county", value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select your county" />
                  </SelectTrigger>
                  <SelectContent>
                    {kenyanCounties.map((county) => (
                      <SelectItem key={county} value={county}>
                        {county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subCounty">
                  Sub County <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subCounty"
                  name="subCounty"
                  placeholder="Enter your sub county"
                  value={formData.subCounty}
                  onChange={handleChange}
                  required
                  className="h-12"
                  autoComplete="off"
                  data-lpignore="true"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="h-12 pr-12"
                    autoComplete="new-password"
                    data-lpignore="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-new-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="h-12 pr-12"
                    autoComplete="new-password"
                    data-lpignore="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                <p className="mb-1">
                  <span className="text-red-500">*</span> Required fields
                </p>
                <p className="mb-1">Password requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>At least 8 characters long</li>
                  <li>At least one uppercase letter (A-Z)</li>
                  <li>At least one lowercase letter (a-z)</li>
                  <li>At least one number (0-9)</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-green-500 to-secondary-500 hover:from-green-600 hover:to-secondary-600"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
