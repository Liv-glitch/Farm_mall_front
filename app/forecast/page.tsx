"use client"

import { motion } from "framer-motion"
import { HarvestForecastPublic } from "@/components/calculators/harvest-forecast-public"
import { Button } from "@/components/ui/button"
import { Leaf, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ForecastPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-agri-50 to-maize-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-agri-700" />
              <span className="text-xl font-bold text-agri-800">Farm Mall</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="text-agri-700 hover:text-agri-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-agri-700 hover:bg-agri-800">Sign Up</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-agri-800 mb-4">
            Harvest Forecast Tool
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Predict optimal harvest timing with weather insights and growth cycle tracking. Plan your farming activities with confidence.
          </p>
        </motion.div>

        <HarvestForecastPublic />
      </main>
    </div>
  )
} 