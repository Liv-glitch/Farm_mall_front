"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  FlaskConical,
  Leaf,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Upload,
} from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// ---------- Types tolerant of the existing/legacy backend response shape ----------

interface DiseaseMatch {
  id: string
  name: string
  scientificName?: string
  description?: string
  severity?: string
  confidence?: number // 0..1
  cropType?: string
  referenceImageUrl?: string
  symptoms?: string[]
  causes?: string[]
  treatment?: {
    organic?: string[]
    chemical?: string[]
    prevention?: string[]
    immediate?: string[]
  }
}

interface HistoryItem {
  id: string
  createdAt: string
  match: DiseaseMatch | null
  uploadedImageUrl?: string
}

type Step = "upload" | "match" | "treat"
type View = "new" | "history"
type TreatmentTab = "organic" | "chemical" | "prevention"

// ---------- Helpers to extract data from the assessPlantHealth response ----------

const extractData = (res: any) => (res?.data ? res.data : res) || {}

const extractMatches = (res: any): DiseaseMatch[] => {
  const data = extractData(res)
  const raw = Array.isArray(data?.diseases) ? data.diseases : []

  return raw.slice(0, 3).map((d: any, idx: number): DiseaseMatch => {
    const confidence =
      typeof d?.confidence === "number"
        ? d.confidence > 1
          ? d.confidence / 100
          : d.confidence
        : typeof d?.probability === "number"
          ? d.probability
          : undefined

    const treatment = data?.treatment || d?.treatment || {}

    return {
      id: d?.id || `${idx}`,
      name: d?.commonName || d?.name || "Unknown disease",
      scientificName: d?.scientificName || d?.scientific_name,
      description: d?.description,
      severity: d?.severity,
      confidence,
      cropType:
        d?.cropType ||
        d?.crop ||
        data?.plants?.[0]?.commonName ||
        data?.plants?.[0]?.name,
      referenceImageUrl:
        d?.referenceImageUrl ||
        d?.image_url ||
        d?.imageUrl ||
        d?.referenceImage ||
        d?.image,
      symptoms: Array.isArray(d?.symptoms) ? d.symptoms : undefined,
      causes: Array.isArray(d?.causes) ? d.causes : undefined,
      treatment: {
        organic: treatment?.organic,
        chemical: treatment?.chemical,
        prevention: treatment?.prevention,
        immediate: treatment?.immediate,
      },
    }
  })
}

const formatConfidence = (c?: number) =>
  typeof c === "number" ? `${Math.round(c * 100)}%` : undefined

const severityBadgeClass = (sev?: string) => {
  const s = (sev || "").toLowerCase()
  if (s.includes("high") || s.includes("severe")) {
    return "bg-red-100 text-red-700 border border-red-200"
  }
  if (s.includes("low") || s.includes("mild")) {
    return "bg-green-100 text-green-700 border border-green-200"
  }
  return "bg-orange-100 text-orange-700 border border-orange-200"
}

const formatHistoryDate = (iso?: string) => {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  })
}

// ---------- Component ----------

export function DiagnosisPage() {
  const { toast } = useToast()

  const [view, setView] = useState<View>("new")
  const [step, setStep] = useState<Step>("upload")

  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<DiseaseMatch[]>([])
  const [selectedMatch, setSelectedMatch] = useState<DiseaseMatch | null>(null)
  const [treatmentTab, setTreatmentTab] = useState<TreatmentTab>("organic")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    loadHistory()
    // We only want to load once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!image) {
      setImagePreview(null)
      return
    }
    const url = URL.createObjectURL(image)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const res: any = await apiClient.getAnalysisHistory({
        type: "plant_health",
        limit: 50,
      })
      const records: any[] =
        res?.data?.records || res?.records || res?.data || []

      const items: HistoryItem[] = records
        .map((r: any): HistoryItem | null => {
          const matchesForRecord = extractMatches(r?.result || r)
          const primary = matchesForRecord[0] || null
          return {
            id: r?.id || r?.analysisId || "",
            createdAt: r?.createdAt || r?.created_at || "",
            match: primary,
            uploadedImageUrl:
              r?.media?.variants?.thumbnail ||
              r?.media?.variants?.small ||
              r?.media?.originalUrl ||
              r?.mediaUrls?.[0] ||
              undefined,
          }
        })
        .filter(
          (item): item is HistoryItem => !!(item && item.id && item.match)
        )

      setHistory(items)
    } catch (err) {
      console.error("Failed to load diagnosis history", err)
    } finally {
      setHistoryLoading(false)
    }
  }

  const resetWizard = () => {
    setImage(null)
    setMatches([])
    setSelectedMatch(null)
    setNote("")
    setStep("upload")
    setTreatmentTab("organic")
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  const handleFile = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Unsupported file",
        description: "Please upload an image (JPG or PNG).",
        variant: "destructive",
      })
      return
    }
    setImage(file)
    void runDiagnosis(file)
  }

  const runDiagnosis = async (file: File) => {
    setLoading(true)
    setMatches([])
    setSelectedMatch(null)
    setStep("upload")
    try {
      const res: any = await apiClient.assessPlantHealth({
        image: file,
        similar_images: true,
      })

      const extracted = extractMatches(res)
      if (extracted.length === 0) {
        toast({
          title: "No matches found",
          description:
            "We could not identify any diseases. Try a clearer photo focused on the affected leaf.",
          variant: "destructive",
        })
        resetWizard()
        return
      }

      setMatches(extracted)
      setStep("match")
    } catch (err: any) {
      console.error("Diagnosis failed", err)
      toast({
        title: "Diagnosis failed",
        description: err?.message || "Please try again with a different photo.",
        variant: "destructive",
      })
      resetWizard()
    } finally {
      setLoading(false)
    }
  }

  const handleSelectMatch = (match: DiseaseMatch) => {
    setSelectedMatch(match)
    setStep("treat")
    setTreatmentTab("organic")
  }

  const handleSaveRecord = async () => {
    // The diagnosis itself is already persisted by POST /enhanced-plant/health.
    // Attaching the free-text note still requires a new backend endpoint
    // (PATCH /enhanced-plant/analysis/:id) - flagged for the backend team.
    setSaving(true)
    try {
      await loadHistory()
      toast({
        title: "Saved to history",
        description: note
          ? "Diagnosis saved. Your note is kept locally for now."
          : "Diagnosis saved to your history.",
      })
      resetWizard()
      setView("history")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteHistory = async (id: string) => {
    try {
      await apiClient.deleteAnalysis(id, "plant_health")
      setHistory((prev) => prev.filter((h) => h.id !== id))
      toast({ title: "Removed", description: "Diagnosis removed from history." })
    } catch (err: any) {
      console.error("Failed to delete record", err)
      toast({
        title: "Could not remove",
        description: err?.message || "Please try again.",
        variant: "destructive",
      })
    }
  }

  const treatmentList = useMemo<string[]>(() => {
    if (!selectedMatch?.treatment) return []
    const t = selectedMatch.treatment
    if (treatmentTab === "organic") return t.organic || t.immediate || []
    if (treatmentTab === "chemical") return t.chemical || []
    return t.prevention || []
  }, [selectedMatch, treatmentTab])

  // ---------- Render ----------

  return (
    <div className="-m-3 sm:-m-4 md:-m-6 lg:-m-8 -mt-4 sm:-mt-6 -mb-20 sm:-mb-8 bg-[#f3ece0] min-h-[calc(100dvh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-md bg-[#e7dcc8]">
              <FlaskConical className="h-5 w-5 text-[#6E3B1E]" />
            </div>
            <h1
              className="text-3xl font-semibold text-[#2c2418]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Diagnosis
            </h1>
          </div>

          {/* New / History pill toggle */}
          <div className="inline-flex items-center gap-1 rounded-full bg-white p-1 shadow-sm border border-[#e7dcc8]">
            <button
              type="button"
              onClick={() => setView("new")}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                view === "new"
                  ? "bg-[#1f3a23] text-white"
                  : "text-[#3a2f1f] hover:bg-[#f3ece0]"
              }`}
            >
              New Diagnosis
            </button>
            <button
              type="button"
              onClick={() => setView("history")}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                view === "history"
                  ? "bg-[#1f3a23] text-white"
                  : "text-[#3a2f1f] hover:bg-[#f3ece0]"
              }`}
            >
              History · {history.length}
            </button>
          </div>
        </div>

        <p className="text-sm text-[#5b4d36] mb-6 max-w-2xl">
          Take a photo of an infected plant. Find out what the disease is and
          how to treat it.
        </p>

        {view === "new" ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            <div className="space-y-6">
              {step !== "treat" && <Stepper step={step} />}

              {step === "upload" && (
                <UploadCard
                  loading={loading}
                  isDragging={isDragging}
                  onDragEnter={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(file) => {
                    setIsDragging(false)
                    handleFile(file)
                  }}
                  onPickFile={() => fileInputRef.current?.click()}
                  onTakePhoto={() => cameraInputRef.current?.click()}
                />
              )}

              {step === "match" && (
                <MatchCard
                  matches={matches}
                  onSelect={handleSelectMatch}
                  onRestart={resetWizard}
                />
              )}

              {step === "treat" && selectedMatch && (
                <TreatView
                  match={selectedMatch}
                  uploadedImage={imagePreview}
                  treatmentTab={treatmentTab}
                  onTreatmentTabChange={setTreatmentTab}
                  treatmentList={treatmentList}
                  note={note}
                  onNoteChange={setNote}
                  onBack={() => setStep("match")}
                  onSave={handleSaveRecord}
                  onChooseDifferent={() => {
                    setSelectedMatch(null)
                    setStep("match")
                  }}
                  saving={saving}
                />
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
            </div>

            <SideTips />
          </div>
        ) : (
          <HistoryList
            items={history}
            loading={historyLoading}
            onRemove={handleDeleteHistory}
            onStartNew={() => {
              setView("new")
              resetWizard()
            }}
          />
        )}
      </div>
    </div>
  )
}

// ---------- Sub-components ----------

function Stepper({ step }: { step: Step }) {
  const items: { id: Step; label: string; num: number }[] = [
    { id: "upload", label: "UPLOAD", num: 1 },
    { id: "match", label: "MATCH", num: 2 },
    { id: "treat", label: "TREAT", num: 3 },
  ]

  const activeIndex = items.findIndex((i) => i.id === step)

  return (
    <div className="flex items-center gap-3 text-sm">
      {items.map((item, idx) => {
        const isActive = idx === activeIndex
        const isDone = idx < activeIndex
        return (
          <div key={item.id} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive
                    ? "bg-[#1f3a23] text-white"
                    : isDone
                      ? "bg-[#1f3a23]/80 text-white"
                      : "bg-[#e7dcc8] text-[#5b4d36]"
                }`}
              >
                {item.num}
              </div>
              <span
                className={`tracking-wider font-semibold ${
                  isActive
                    ? "text-[#1f3a23]"
                    : isDone
                      ? "text-[#1f3a23]/80"
                      : "text-[#5b4d36]/70"
                }`}
              >
                {item.label}
              </span>
            </div>
            {idx < items.length - 1 && (
              <div className="w-8 h-px bg-[#5b4d36]/30" />
            )}
          </div>
        )
      })}
    </div>
  )
}

interface UploadCardProps {
  loading: boolean
  isDragging: boolean
  onDragEnter: () => void
  onDragLeave: () => void
  onDrop: (file: File) => void
  onPickFile: () => void
  onTakePhoto: () => void
}

function UploadCard({
  loading,
  isDragging,
  onDragEnter,
  onDragLeave,
  onDrop,
  onPickFile,
  onTakePhoto,
}: UploadCardProps) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        onDragEnter()
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        onDragLeave()
      }}
      onDrop={(e) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file) onDrop(file)
      }}
      className={`bg-white/70 border-2 border-dashed rounded-2xl p-10 sm:p-16 text-center transition-colors ${
        isDragging
          ? "border-[#1f3a23] bg-white"
          : "border-[#c8b896] hover:border-[#1f3a23]/60"
      }`}
    >
      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-[#1f3a23] animate-spin" />
          <div>
            <p className="text-lg font-semibold text-[#2c2418]">
              Analyzing your photo
            </p>
            <p className="text-sm text-[#5b4d36] mt-1 max-w-sm mx-auto">
              This usually takes 30-60 seconds. Please keep this page open.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-[#e7dcc8] flex items-center justify-center">
            <Leaf className="h-7 w-7 text-[#1f3a23]" />
          </div>
          <h2
            className="text-2xl font-semibold text-[#2c2418]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Take a photo of the sick plant
          </h2>
          <p className="text-sm text-[#5b4d36] max-w-md">
            Make sure the photo is clear and well lit. Get close so the sick
            leaf or fruit fills the frame.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <Button
              type="button"
              onClick={onPickFile}
              className="bg-[#1f3a23] hover:bg-[#15291a] text-white rounded-full px-6"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload photo
            </Button>
            <Button
              type="button"
              onClick={onTakePhoto}
              variant="outline"
              className="rounded-full px-6 border-[#c8b896] text-[#2c2418] hover:bg-white"
            >
              <Camera className="h-4 w-4 mr-2" />
              Take photo
            </Button>
          </div>
          <p className="text-xs text-[#5b4d36]/80 mt-1">
            You can also drop a photo here · JPG or PNG
          </p>
        </div>
      )}
    </div>
  )
}

interface MatchCardProps {
  matches: DiseaseMatch[]
  onSelect: (m: DiseaseMatch) => void
  onRestart: () => void
}

function MatchCard({ matches, onSelect, onRestart }: MatchCardProps) {
  const top = matches[0]
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#e7dcc8] p-5 flex items-center gap-4">
        <div className="h-16 w-16 rounded-xl overflow-hidden bg-[#f3ece0] flex-shrink-0">
          {top?.referenceImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={top.referenceImageUrl}
              alt={top.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[#5b4d36]">
              <Leaf className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="text-xs tracking-wider font-semibold text-[#5b4d36]/80">
            TOP MATCHES
          </div>
          <div
            className="text-xl font-semibold text-[#2c2418]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Select the closest match
          </div>
          <div className="text-sm text-[#5b4d36] mt-0.5">
            Pick the option that looks most like what you see on your farm.
          </div>
        </div>
        <button
          type="button"
          onClick={onRestart}
          className="text-sm font-medium text-[#1f3a23] hover:underline"
        >
          Start again
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {matches.map((m, idx) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m)}
            className="text-left bg-white rounded-2xl border border-[#e7dcc8] hover:border-[#1f3a23] hover:shadow-md transition-all overflow-hidden group"
          >
            <div className="relative aspect-[4/3] bg-[#f3ece0]">
              {m.referenceImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.referenceImageUrl}
                  alt={m.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[#5b4d36]">
                  <Leaf className="h-10 w-10" />
                </div>
              )}
              {idx === 0 && (
                <div className="absolute top-2 left-2 bg-[#1f3a23] text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
                  <span className="text-yellow-300">★</span>
                  Best match
                </div>
              )}
              {formatConfidence(m.confidence) && (
                <div className="absolute bottom-2 right-2 bg-white/95 text-[#2c2418] text-xs font-semibold px-2 py-1 rounded-md">
                  {formatConfidence(m.confidence)} match
                </div>
              )}
            </div>
            <div className="p-4">
              {m.cropType && (
                <div className="text-xs text-[#5b4d36]/80">{m.cropType}</div>
              )}
              <div className="font-semibold text-[#2c2418]">{m.name}</div>
              {m.scientificName && (
                <div className="text-xs italic text-[#5b4d36] mt-0.5">
                  {m.scientificName}
                </div>
              )}
              {m.severity && (
                <div
                  className={`inline-block mt-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded ${severityBadgeClass(m.severity)}`}
                >
                  {m.severity} severity
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

interface TreatViewProps {
  match: DiseaseMatch
  uploadedImage: string | null
  treatmentTab: TreatmentTab
  onTreatmentTabChange: (t: TreatmentTab) => void
  treatmentList: string[]
  note: string
  onNoteChange: (n: string) => void
  onBack: () => void
  onSave: () => void
  onChooseDifferent: () => void
  saving: boolean
}

function TreatView({
  match,
  uploadedImage,
  treatmentTab,
  onTreatmentTabChange,
  treatmentList,
  note,
  onNoteChange,
  onBack,
  onSave,
  onChooseDifferent,
  saving,
}: TreatViewProps) {
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center text-sm font-medium text-[#1f3a23] hover:underline"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to choices
      </button>

      {/* Disease detail card */}
      <div className="bg-white rounded-2xl border border-[#e7dcc8] p-5">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Image stack */}
          <div className="flex flex-col gap-3 sm:w-48 flex-shrink-0">
            {uploadedImage && (
              <div className="aspect-square rounded-xl overflow-hidden bg-[#f3ece0]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadedImage}
                  alt="Your photo"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            {match.referenceImageUrl && (
              <div className="aspect-square rounded-xl overflow-hidden bg-[#f3ece0]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={match.referenceImageUrl}
                  alt={`${match.name} reference`}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Disease details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                {match.cropType && (
                  <div className="text-[10px] tracking-wider font-semibold text-[#5b4d36] uppercase">
                    {match.cropType}
                  </div>
                )}
                <h2
                  className="text-2xl font-semibold text-[#2c2418]"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  {match.name}
                </h2>
                {match.scientificName && (
                  <div className="text-sm italic text-[#5b4d36] mt-0.5">
                    {match.scientificName}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {match.severity && (
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded ${severityBadgeClass(match.severity)}`}
                  >
                    {match.severity} severity
                  </span>
                )}
                {formatConfidence(match.confidence) && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-[#e7dcc8] text-[#2c2418]">
                    {formatConfidence(match.confidence)} confidence
                  </span>
                )}
              </div>
            </div>

            {match.description && (
              <p className="text-sm text-[#3a2f1f] mt-3 leading-relaxed">
                {match.description}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
              {match.symptoms && match.symptoms.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-[#2c2418] mb-2">
                    <span aria-hidden>🌿</span> Symptoms
                  </div>
                  <ul className="space-y-1.5 text-sm text-[#3a2f1f] list-disc pl-4">
                    {match.symptoms.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {match.causes && match.causes.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-[#2c2418] mb-2">
                    <span aria-hidden>⚠️</span> Causes
                  </div>
                  <ul className="space-y-1.5 text-sm text-[#3a2f1f] list-disc pl-4">
                    {match.causes.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* What to do next */}
      <div className="bg-white rounded-2xl border border-[#e7dcc8] p-5">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical className="h-4 w-4 text-[#6E3B1E]" />
          <h3 className="text-base font-semibold text-[#2c2418]">
            What to do next
          </h3>
        </div>

        <div className="border-b border-[#e7dcc8] flex items-center gap-6 mb-4">
          {(["organic", "chemical", "prevention"] as TreatmentTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTreatmentTabChange(tab)}
              className={`pb-2 text-sm font-medium capitalize -mb-px border-b-2 transition-colors ${
                treatmentTab === tab
                  ? "border-[#1f3a23] text-[#1f3a23]"
                  : "border-transparent text-[#5b4d36] hover:text-[#2c2418]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {treatmentList.length > 0 ? (
          <ol className="space-y-3">
            {treatmentList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[#e7dcc8] text-[#2c2418] text-xs font-semibold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-sm text-[#3a2f1f] pt-0.5">{item}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-[#5b4d36]">
            Recommendations for the{" "}
            <span className="font-medium">{treatmentTab}</span> approach are not
            available for this match yet.
          </p>
        )}
      </div>

      {/* Save record */}
      <div className="bg-white rounded-2xl border border-[#e7dcc8] p-5">
        <h3 className="text-base font-semibold text-[#2c2418]">
          Save this record
        </h3>
        <p className="text-sm text-[#5b4d36] mt-1">
          Add a note about where you found it and what you have tried. It will
          help you keep track.
        </p>
        <Textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="For example: North side of the farm, row 4. Sprayed Mancozeb on Tuesday."
          className="mt-3 bg-[#f9f3e7] border-[#e7dcc8] focus-visible:ring-[#1f3a23]"
          rows={4}
        />
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="bg-[#1f3a23] hover:bg-[#15291a] text-white rounded-full px-6"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Save for later
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onChooseDifferent}
            className="rounded-full px-6 border-[#c8b896] text-[#2c2418] hover:bg-[#f3ece0]"
          >
            Choose a different match
          </Button>
        </div>
      </div>
    </div>
  )
}

function SideTips() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#e7dcc8] p-5">
        <div className="text-[10px] tracking-wider font-semibold text-[#5b4d36] uppercase">
          Tips
        </div>
        <h3
          className="text-xl font-semibold text-[#2c2418] mt-1"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          How to take a good photo
        </h3>
        <ul className="mt-3 space-y-2.5 text-sm text-[#3a2f1f]">
          {[
            "Take photos during the day, no flash",
            "Focus on one leaf or fruit at a time",
            "Include both the sick and healthy parts",
            "Flip the leaf and photograph the underside too",
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#1f3a23] mt-0.5 flex-shrink-0" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-[#1f3a23] text-white rounded-2xl p-5">
        <div className="flex items-center gap-2 text-xs tracking-wider font-semibold uppercase mb-2">
          <ShieldAlert className="h-4 w-4 text-yellow-300" />
          Safety
        </div>
        <p className="text-sm leading-relaxed text-white/90">
          Read the chemical label carefully. Wear gloves and a mask. Observe the
          recommended waiting period after spraying before harvesting.
        </p>
      </div>
    </div>
  )
}

interface HistoryListProps {
  items: HistoryItem[]
  loading: boolean
  onRemove: (id: string) => void
  onStartNew: () => void
}

function HistoryList({ items, loading, onRemove, onStartNew }: HistoryListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#e7dcc8] p-10 text-center">
        <Loader2 className="h-6 w-6 text-[#1f3a23] animate-spin mx-auto" />
        <p className="text-sm text-[#5b4d36] mt-3">Loading your history…</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e7dcc8] p-10 text-center">
        <div className="h-14 w-14 rounded-full bg-[#f3ece0] flex items-center justify-center mx-auto">
          <Leaf className="h-7 w-7 text-[#1f3a23]" />
        </div>
        <h3
          className="text-xl font-semibold text-[#2c2418] mt-3"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          No diagnoses yet
        </h3>
        <p className="text-sm text-[#5b4d36] mt-1">
          Run a new diagnosis to build your history.
        </p>
        <Button
          type="button"
          onClick={onStartNew}
          className="mt-4 bg-[#1f3a23] hover:bg-[#15291a] text-white rounded-full px-6"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          New Diagnosis
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-2xl border border-[#e7dcc8] overflow-hidden flex flex-col"
        >
          <div className="grid grid-cols-2 h-40 bg-[#f3ece0]">
            {item.uploadedImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.uploadedImageUrl}
                alt="Your photo"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[#5b4d36]">
                <Leaf className="h-6 w-6" />
              </div>
            )}
            {item.match?.referenceImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.match.referenceImageUrl}
                alt={item.match.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[#5b4d36] bg-[#ece2cd]">
                <Leaf className="h-6 w-6" />
              </div>
            )}
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <div className="text-xs text-[#5b4d36]">
              {item.match?.cropType ? `${item.match.cropType} · ` : ""}
              {formatHistoryDate(item.createdAt)}
            </div>
            <div className="font-semibold text-[#2c2418] mt-0.5">
              {item.match?.name || "Plant Health"}
            </div>
            <div className="flex items-center justify-between mt-3">
              {item.match?.severity ? (
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded ${severityBadgeClass(item.match.severity)}`}
                >
                  {item.match.severity} severity
                </span>
              ) : (
                <span />
              )}
              {formatConfidence(item.match?.confidence) && (
                <span className="text-xs font-semibold text-[#2c2418]">
                  {formatConfidence(item.match?.confidence)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#5b4d36] hover:text-red-700 self-start"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
