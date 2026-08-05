"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { DecisionReportGenerateResponse, DecisionReportRequest } from "@/lib/types/decision-report"

interface DecisionReportContextType {
  report: DecisionReportGenerateResponse | null
  input: DecisionReportRequest | null
  setReport: (report: DecisionReportGenerateResponse, input: DecisionReportRequest) => void
  clearReport: () => void
}

const DecisionReportContext = createContext<DecisionReportContextType | undefined>(undefined)

/**
 * Holds the most recently generated Farm Decision Report in memory only.
 * Nothing here touches localStorage/sessionStorage/cookies, so a page
 * refresh always loses the report — by design, since the backend never
 * persists the report either.
 */
export function DecisionReportProvider({ children }: { children: ReactNode }) {
  const [report, setReportState] = useState<DecisionReportGenerateResponse | null>(null)
  const [input, setInputState] = useState<DecisionReportRequest | null>(null)

  const setReport = useCallback((newReport: DecisionReportGenerateResponse, newInput: DecisionReportRequest) => {
    setReportState(newReport)
    setInputState(newInput)
  }, [])

  const clearReport = useCallback(() => {
    setReportState(null)
    setInputState(null)
  }, [])

  return (
    <DecisionReportContext.Provider value={{ report, input, setReport, clearReport }}>
      {children}
    </DecisionReportContext.Provider>
  )
}

export function useDecisionReport() {
  const context = useContext(DecisionReportContext)
  if (context === undefined) {
    throw new Error("useDecisionReport must be used within a DecisionReportProvider")
  }
  return context
}
