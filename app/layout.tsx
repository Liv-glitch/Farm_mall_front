import type { Metadata } from "next"
import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/hooks/use-auth"
import { Toaster } from "@/components/ui/toaster"
import "@/styles/globals.css"

export const metadata: Metadata = {
  title: "Farm Mall",
  description: "Modern agricultural technology platform for farmers",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
