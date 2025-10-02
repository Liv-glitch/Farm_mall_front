"use client"

import { useState, useEffect } from "react"
import { MessageCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { config } from "@/lib/config"

interface WhatsAppBackButtonProps {
  className?: string
}

export function WhatsAppBackButton({ className = "" }: WhatsAppBackButtonProps) {
  const [showButton, setShowButton] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    // Check if user came from WhatsApp using your existing detection method
    const checkWhatsAppOrigin = () => {
      // Method 1: Check URL params for WhatsApp token (from your existing code)
      const urlParams = new URLSearchParams(window.location.search)
      const hasToken = urlParams.get('token')
      
      // Method 2: Check if they have stored WhatsApp auth token
      const hasStoredToken = localStorage.getItem(config.auth.tokenKey)
      
      // Method 3: Check session storage for persistence across navigation
      const whatsappSession = sessionStorage.getItem('from_whatsapp')
      
      return !!(hasToken || hasStoredToken || whatsappSession)
    }

    const shouldShow = checkWhatsAppOrigin()
    setShowButton(shouldShow)

    // Set session indicator for future page navigations within the session
    if (shouldShow) {
      sessionStorage.setItem('from_whatsapp', 'true')
    }
  }, [])

  const handleBackToWhatsApp = () => {
    toast({
      title: "Redirecting to WhatsApp",
      description: "Taking you back to FarmMall WhatsApp chat",
    })
    
    // Open WhatsApp link
    window.open('https://wa.me/254740750413?text=Back+to+FarmMall', '_blank')
  }

  if (!showButton) {
    return null
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Button
        onClick={handleBackToWhatsApp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          h-12 px-3 sm:px-4 bg-[#25D366] hover:bg-[#20BA5A] text-white shadow-lg 
          transition-all duration-300 ease-in-out border-0
          ${isHovered ? 'scale-105 shadow-xl' : 'shadow-lg'}
          ${isHovered ? 'w-auto' : 'w-12 sm:w-auto'}
        `}
        size="sm"
      >
        {/* Mobile: Show only icon, Desktop: Show icon + text */}
        <MessageCircle className="h-5 w-5 flex-shrink-0" />
        
        {/* Text that shows on hover on mobile, always on desktop */}
        <span className={`
          ml-2 whitespace-nowrap transition-all duration-200 overflow-hidden
          ${isHovered || 'sm:inline'} 
          ${isHovered ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0 sm:max-w-[200px] sm:opacity-100'}
        `}>
          <ArrowLeft className="h-4 w-4 inline mr-1" />
          Back to WhatsApp
        </span>
      </Button>
    </div>
  )
}