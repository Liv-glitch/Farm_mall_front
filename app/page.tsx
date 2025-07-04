"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Zap, Brain, Leaf, Shield, Calculator, Calendar, BarChart3, Smartphone } from "lucide-react"
import Link from "next/link"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { FloatingElements } from "@/components/ui/floating-elements"
import { CostCalculatorPublic } from "@/components/calculators/cost-calculator-public"
import { HarvestForecastPublic } from "@/components/calculators/harvest-forecast-public"

export default function LandingPage() {
  const features = [
    {
      icon: Calculator,
      title: "Smart Cost Tracking",
      description: "Track every expense from land preparation to harvest for maximum profitability.",
      color: "sage",
    },
    {
      icon: BarChart3,
      title: "Production Management",
      description: "Log activities, monitor crop progress, and track your potato harvest.",
      color: "warm",
    },
    {
      icon: Brain,
      title: "Profit Analysis",
      description: "Calculate profits automatically and optimize your potato farming decisions.",
      color: "sage",
    },
    {
      icon: Calendar,
      title: "Harvest Forecasting",
      description: "Predict optimal harvest times with weather pattern analysis and growth cycle tracking.",
      color: "warm",
    },
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Access your farm data anywhere with our responsive, mobile-optimized platform.",
      color: "sage",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security ensures your farming data is always protected and accessible.",
      color: "warm",
    },
  ]

  const stats = [
    { value: 10000, suffix: "+", label: "Active Farmers" },
    { value: 500000, suffix: "+", label: "Acres Managed" },
    { value: 95, suffix: "%", label: "Success Rate" },
    { value: 50, suffix: "+", label: "Crop Varieties" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-warm-50 to-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-sage-100 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-sage-600 to-warm-500 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-sage-700 to-warm-600 bg-clip-text text-transparent">
              Farm Mall
            </span>
          </motion.div>

          <motion.div
            className="hidden md:flex items-center space-x-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <a href="#features" className="text-gray-600 hover:text-sage-700 transition-colors">
              Features
            </a>
            <a href="#calculators" className="text-gray-600 hover:text-sage-700 transition-colors">
              Tools
            </a>
            <a href="#about" className="text-gray-600 hover:text-sage-700 transition-colors">
              About
            </a>
          </motion.div>

          <motion.div
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="/auth/login">
              <Button variant="ghost" className="text-sage-700 hover:text-sage-800">
                Login
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-sage-700 hover:bg-sage-800 text-white">Get Started</Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <FloatingElements />

        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Badge className="mb-6 bg-sage-100 text-sage-800 border-sage-200">
              <Zap className="w-4 h-4 mr-2" />
              Built for both small-scale and commercial potato farmers in Kenya
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-sage-800 via-warm-700 to-sage-700 bg-clip-text text-transparent leading-tight">
              Everything You Need
              <br />
              in One Platform
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Farm Mall is Kenya's leading digital farming platform designed specifically for potato farmers. Our
              comprehensive tools help you track costs, manage production, and maximize profits—completely free.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/auth/register">
                <Button size="lg" className="bg-sage-700 hover:bg-sage-800 text-white text-lg px-8 py-4">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-4 border-sage-200 hover:bg-sage-50 bg-transparent"
              >
                How It Works
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-sage-700 mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2 + index * 0.2} />
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Everything You Need in One Platform</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools designed specifically for potato farmers to maximize productivity and profitability.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 bg-white group">
                  <CardContent className="p-8 text-center">
                    <div
                      className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                        feature.color === "sage" ? "bg-sage-100" : "bg-warm-100"
                      }`}
                    >
                      <feature.icon
                        className={`w-8 h-8 ${feature.color === "sage" ? "text-sage-700" : "text-warm-600"}`}
                      />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculators Section */}
      <section id="calculators" className="py-20 bg-gradient-to-br from-sage-50 to-warm-50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-warm-100 text-warm-800 border-warm-200">
              <Calculator className="w-4 h-4 mr-2" />
              Try Our Tools
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-sage-800 to-warm-700 bg-clip-text text-transparent">
              Smart Farming Calculators
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get instant estimates and forecasts to make informed farming decisions. No signup required!
            </p>
          </motion.div>

          {/* Cost Calculator */}
          <div className="mb-20">
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Production Cost Calculator</h3>
              <p className="text-gray-600">Calculate estimated production costs for your crops</p>
            </motion.div>
            <CostCalculatorPublic />
          </div>

          {/* Harvest Forecast */}
          <div>
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Harvest Forecast Tool</h3>
              <p className="text-gray-600">Predict optimal harvest timing with weather insights</p>
            </motion.div>
            <HarvestForecastPublic />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-sage-700 to-warm-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Farm?</h2>
            <p className="text-xl text-sage-100 mb-8 max-w-2xl mx-auto">
              Join thousands of farmers who are already using Farm Mall to increase their yields and profits.
            </p>
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-sage-700 hover:bg-gray-100 text-lg px-8 py-4">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-sage-600 to-warm-500 rounded-lg flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Farm Mall</span>
              </div>
              <p className="text-gray-400">
                Empowering farmers with cutting-edge technology for sustainable and profitable agriculture.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Farm Mall. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
