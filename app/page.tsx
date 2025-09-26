"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Instagram, Twitter, Facebook, Linkedin, Calculator, Clock, Sprout, Menu, X } from "lucide-react"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src="https://xnrlzezteajvrhlq.public.blob.vercel-storage.com/farmmall/WhatsApp_Image_2025-09-07_at_8.31.25_AM-removebg-preview%20%281%29.png"
                alt="Farm Mall Logo"
                width={48}
                height={48}
                className="h-12 w-12"
              />
              <span className="text-xl font-bold text-agri-800">Farm Mall</span>
            </motion.div>
            
            {/* Desktop Navigation */}
            <motion.div 
              className="hidden md:flex items-center space-x-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link href="#about" className="text-gray-700 hover:text-agri-700 transition-colors font-medium">
                About Us
              </Link>
              <Link href="/calculator" className="text-gray-700 hover:text-agri-700 transition-colors font-medium">
                Cost Calculator
              </Link>
              <Link href="/forecast" className="text-gray-700 hover:text-agri-700 transition-colors font-medium">
                Harvest Estimator
              </Link>
              <Link href="/auth/login" className="text-gray-700 hover:text-agri-700 transition-colors font-medium">
                Login
              </Link>
              <Link href="/auth/register">
                <Button className="bg-agri-700 hover:bg-agri-800">Sign Up</Button>
              </Link>
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-agri-700 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </motion.button>
          </nav>

          {/* Mobile Navigation Menu */}
          <motion.div
            className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: mobileMenuOpen ? 1 : 0, 
              height: mobileMenuOpen ? 'auto' : 0 
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="py-4 space-y-4 border-t border-gray-200 mt-4">
              <Link 
                href="#about" 
                className="block text-gray-700 hover:text-agri-700 transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <Link 
                href="/calculator" 
                className="block text-gray-700 hover:text-agri-700 transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cost Calculator
              </Link>
              <Link 
                href="/forecast" 
                className="block text-gray-700 hover:text-agri-700 transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Harvest Estimator
              </Link>
              <Link 
                href="/auth/login" 
                className="block text-gray-700 hover:text-agri-700 transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="w-full bg-agri-700 hover:bg-agri-800">Sign Up</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center">
        <div className="absolute inset-0">
          <Image
            src="https://xnrlzezteajvrhlq.public.blob.vercel-storage.com/farmmall/openfarm.avif"
            alt="Farm landscape background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <motion.div 
          className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">Farm Management Made Simple</h1>
          <p className="text-xl md:text-2xl mb-4 max-w-4xl mx-auto leading-relaxed">
            Farm Mall is Kenya's leading digital farming platform designed specifically for potato farmers.
          </p>
          <p className="text-lg md:text-xl mb-12 max-w-4xl mx-auto leading-relaxed opacity-90">
            Our comprehensive tools help you track costs, manage production, and maximize profits — completely free.
          </p>
        </motion.div>
      </section>

      {/* Floating Feature Cards */}
      <section className="relative -mt-24 z-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div 
            className="grid md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link href="/calculator">
              <Card className="bg-agri-800 border-agri-700 hover:bg-agri-700 transition-all duration-300 transform hover:scale-105 shadow-xl cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Calculator className="h-12 w-12 text-white mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">Calculate Costs</h3>
                  <p className="text-agri-100 text-sm leading-relaxed mb-4">
                    Get accurate cost estimates for your potato farming operations with our smart calculator.
                  </p>
                  <Button variant="secondary" className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/forecast">
              <Card className="bg-agri-700 border-agri-600 hover:bg-agri-600 transition-all duration-300 transform hover:scale-105 shadow-xl cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Clock className="h-12 w-12 text-white mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">Time to Harvest</h3>
                  <p className="text-agri-100 text-sm leading-relaxed mb-4">
                    Predict optimal harvest timing with weather insights and growth cycle tracking.
                  </p>
                  <Button variant="secondary" className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                    Check Timeline
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/auth/register">
              <Card className="bg-agri-800 border-agri-700 hover:bg-agri-700 transition-all duration-300 transform hover:scale-105 shadow-xl cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Sprout className="h-12 w-12 text-white mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">Start Production</h3>
                  <p className="text-agri-100 text-sm leading-relaxed mb-4">
                    Begin your farming journey with our comprehensive production management tools.
                  </p>
                  <Button variant="secondary" className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                    Begin Journey
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-20 bg-gray-50 pt-32">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center text-agri-800 mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            What We Offer
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Smart Notifications */}
            <motion.div 
              className="flex items-start hover:shadow-lg transition-shadow duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-20 h-28 rounded-xl overflow-hidden bg-agri-100 flex-shrink-0">
                <Image
                  src="https://xnrlzezteajvrhlq.public.blob.vercel-storage.com/farmmall/openfarm.avif"
                  alt="Smart notifications illustration"
                  width={80}
                  height={112}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-1 bg-agri-50 py-8 px-4 rounded-r-lg h-28 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-agri-800 mb-1">Smart Notifications</h3>
                <p className="text-gray-700 text-sm leading-tight">
                  Receive timely reminders for critical activities like fertilizer application and pest control.
                </p>
              </div>
            </motion.div>

            {/* Location Intelligence */}
            <motion.div 
              className="flex items-start hover:shadow-lg transition-shadow duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="w-20 h-28 rounded-xl overflow-hidden bg-agri-100 flex-shrink-0">
                <Image
                  src="https://xnrlzezteajvrhlq.public.blob.vercel-storage.com/farmmall/openfarm.avif"
                  alt="Location intelligence illustration"
                  width={80}
                  height={112}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-1 bg-agri-50 py-8 px-4 rounded-r-lg h-28 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-agri-800 mb-1">Location Intelligence</h3>
                <p className="text-gray-700 text-sm leading-tight">
                  Get localized recommendations and weather insights based on your specific farming location.
                </p>
              </div>
            </motion.div>

            {/* Production Management */}
            <motion.div 
              className="flex items-start hover:shadow-lg transition-shadow duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="w-20 h-28 rounded-xl overflow-hidden bg-sage-100 flex-shrink-0">
                <Image
                  src="https://xnrlzezteajvrhlq.public.blob.vercel-storage.com/farmmall/openfarm.avif"
                  alt="Production management illustration"
                  width={80}
                  height={112}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-1 bg-sage-50 py-8 px-4 rounded-r-lg h-28 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-sage-800 mb-1">Production Management</h3>
                <p className="text-gray-700 text-sm leading-tight">
                  Log activities, monitor crop progress, and track your potato harvest.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-sage-800">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">Join Us Today</h3>
            <p className="text-xl text-sage-100 mb-8 max-w-2xl mx-auto">
              Start your journey towards smarter farming with our comprehensive digital platform.
            </p>
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-sage-800 hover:bg-gray-100 font-semibold px-8 py-3">
                Get Started Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-12">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center space-x-8 mb-6">
              <Link href="https://www.instagram.com/farmm_all/?hl=en" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-8 w-8" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="https://x.com/FarmMall1" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-8 w-8" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="https://www.facebook.com/profile.php?id=100063807947336" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-8 w-8" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="https://www.linkedin.com/company/73202637/admin/page-posts/published/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-8 w-8" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Image
                src="https://xnrlzezteajvrhlq.public.blob.vercel-storage.com/farmmall/WhatsApp_Image_2025-09-07_at_8.31.25_AM-removebg-preview%20%281%29.png"
                alt="Farm Mall Logo"
                width={36}
                height={36}
                className="h-9 w-9"
              />
              <span className="text-xl font-bold text-white">Farm Mall</span>
            </div>
            <p className="text-gray-400">© 2025 Farm Mall. All rights reserved.</p>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
