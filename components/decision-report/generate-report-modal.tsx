"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, CalendarDays, ChevronDown, Droplets, Loader2, MapPin, Sprout, Target } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import { KENYAN_COUNTIES } from "@/lib/data/kenyan-counties"
import { useDecisionReport } from "@/lib/hooks/use-decision-report"
import {
  FARMING_PRIORITY_LABELS,
  SEED_SOURCE_LABELS,
  WATER_SOURCE_LABELS,
  type DecisionReportFormOptionVariety,
  type DecisionReportRequest,
  type FarmingPriority,
  type SeedSource,
  type WaterSource,
} from "@/lib/types/decision-report"

interface GenerateReportModalProps {
  isOpen: boolean
  onClose: () => void
}

const MAX_VARIETIES = 4

const DEFAULT_WATER_SOURCES: WaterSource[] = ["rainfed", "irrigated"]
const DEFAULT_SEED_SOURCES: SeedSource[] = ["certified", "farm_saved", "unknown"]
const DEFAULT_PRIORITIES: FarmingPriority[] = ["yield", "disease_resistance", "cost", "balanced"]

interface FormState {
  county: string
  subCounty: string
  locationName: string
  fieldSizeAcres: string
  waterSource: WaterSource
  plantingDate: string
  previousCrop: string
  seedSource: SeedSource
  cropVarietyIds: string[]
  priority: FarmingPriority
}

const INITIAL_FORM: FormState = {
  county: "",
  subCounty: "",
  locationName: "",
  fieldSizeAcres: "",
  waterSource: "rainfed",
  plantingDate: "",
  previousCrop: "",
  seedSource: "certified",
  cropVarietyIds: [],
  priority: "balanced",
}

export function GenerateReportModal({ isOpen, onClose }: GenerateReportModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { setReport } = useDecisionReport()

  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [varieties, setVarieties] = useState<DecisionReportFormOptionVariety[]>([])
  const [waterSources, setWaterSources] = useState<WaterSource[]>(DEFAULT_WATER_SOURCES)
  const [seedSources, setSeedSources] = useState<SeedSource[]>(DEFAULT_SEED_SOURCES)
  const [priorities, setPriorities] = useState<FarmingPriority[]>(DEFAULT_PRIORITIES)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const selectedVarieties = useMemo(
    () =>
      form.cropVarietyIds
        .map((id) => varieties.find((variety) => variety.id === id))
        .filter((variety): variety is DecisionReportFormOptionVariety => Boolean(variety)),
    [form.cropVarietyIds, varieties]
  )

  const varietyDropdownLabel = useMemo(() => {
    if (selectedVarieties.length === 0) return "Select varieties"

    const selectedNames = selectedVarieties.map((variety) => variety.name).join(", ")
    if (selectedNames.length <= 34) return selectedNames

    return `${selectedVarieties.length} variet${selectedVarieties.length === 1 ? "y" : "ies"} selected`
  }, [selectedVarieties])

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    async function loadOptions() {
      setOptionsLoading(true)
      setOptionsError(null)
      try {
        const options = await apiClient.getDecisionReportFormOptions()
        if (cancelled) return
        setVarieties(Array.isArray(options?.varieties) ? options.varieties : [])
        if (Array.isArray(options?.waterSources) && options.waterSources.length > 0) {
          setWaterSources(options.waterSources)
        }
        if (Array.isArray(options?.seedSources) && options.seedSources.length > 0) {
          setSeedSources(options.seedSources)
        }
        if (Array.isArray(options?.priorities) && options.priorities.length > 0) {
          setPriorities(options.priorities)
        }
      } catch (error: any) {
        if (cancelled) return
        setOptionsError(error?.message || "Could not load form options. Please try again.")
      } finally {
        if (!cancelled) setOptionsLoading(false)
      }
    }

    loadOptions()
    return () => {
      cancelled = true
    }
  }, [isOpen])

  const resetAndClose = () => {
    setForm(INITIAL_FORM)
    onClose()
  }

  const toggleVariety = (varietyId: string) => {
    setForm((current) => {
      const isSelected = current.cropVarietyIds.includes(varietyId)
      if (isSelected) {
        return { ...current, cropVarietyIds: current.cropVarietyIds.filter((id) => id !== varietyId) }
      }
      if (current.cropVarietyIds.length >= MAX_VARIETIES) {
        toast({
          title: `You can compare up to ${MAX_VARIETIES} varieties`,
          description: "Unselect one to add another.",
        })
        return current
      }
      return { ...current, cropVarietyIds: [...current.cropVarietyIds, varietyId] }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !form.county ||
      !form.subCounty.trim() ||
      !form.fieldSizeAcres ||
      !form.waterSource ||
      !form.plantingDate ||
      !form.seedSource ||
      !form.priority
    ) {
      toast({
        title: "Missing details",
        description: "Please fill in every required field before generating the report.",
        variant: "destructive",
      })
      return
    }

    if (form.cropVarietyIds.length === 0) {
      toast({
        title: "Pick at least one variety",
        description: `Select up to ${MAX_VARIETIES} potato varieties to include in the report.`,
        variant: "destructive",
      })
      return
    }

    const fieldSizeAcres = Number.parseFloat(form.fieldSizeAcres)
    if (!Number.isFinite(fieldSizeAcres) || fieldSizeAcres <= 0) {
      toast({
        title: "Invalid field size",
        description: "Field size must be a number greater than 0.",
        variant: "destructive",
      })
      return
    }

    const payload: DecisionReportRequest = {
      county: form.county,
      subCounty: form.subCounty.trim(),
      fieldSizeAcres,
      waterSource: form.waterSource,
      plantingDate: form.plantingDate,
      seedSource: form.seedSource,
      cropVarietyIds: form.cropVarietyIds,
      priority: form.priority,
      ...(form.locationName.trim() ? { locationName: form.locationName.trim() } : {}),
      ...(form.previousCrop.trim() ? { previousCrop: form.previousCrop.trim() } : {}),
    }

    setSubmitting(true)
    try {
      const response = await apiClient.generateDecisionReport(payload)
      setReport(response, payload)
      resetAndClose()
      router.push("/dashboard/reports/decision/preview")
    } catch (error: any) {
      toast({
        title: "Could not generate report",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Decision Report</DialogTitle>
          <DialogDescription>
            Tell us about your field and we&apos;ll run a full season forecast — suitability, planting
            window, disease risk, yield, variety ranking and prices.
          </DialogDescription>
        </DialogHeader>

        {optionsLoading ? (
          <div className="flex items-center justify-center py-14 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading form…
          </div>
        ) : optionsError ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <p className="text-sm text-muted-foreground">{optionsError}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOptionsError(null)
                setOptionsLoading(true)
                apiClient
                  .getDecisionReportFormOptions()
                  .then((options) => {
                    setVarieties(Array.isArray(options?.varieties) ? options.varieties : [])
                  })
                  .catch((error: any) => setOptionsError(error?.message || "Could not load form options."))
                  .finally(() => setOptionsLoading(false))
              }}
            >
              Try again
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="report-county" className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-agri-600" /> County
                </Label>
                <Select value={form.county} onValueChange={(value) => setForm({ ...form, county: value })}>
                  <SelectTrigger id="report-county">
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {KENYAN_COUNTIES.map((county) => (
                      <SelectItem key={county} value={county}>
                        {county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-sub-county">Sub-county</Label>
                <Input
                  id="report-sub-county"
                  value={form.subCounty}
                  onChange={(e) => setForm({ ...form, subCounty: e.target.value })}
                  placeholder="e.g. Elburgon"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-location-name">Farm / ward name (optional)</Label>
              <Input
                id="report-location-name"
                value={form.locationName}
                onChange={(e) => setForm({ ...form, locationName: e.target.value })}
                placeholder="e.g. Kiptagich ward"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="report-field-size">Field size (acres)</Label>
                <Input
                  id="report-field-size"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.fieldSizeAcres}
                  onChange={(e) => setForm({ ...form, fieldSizeAcres: e.target.value })}
                  placeholder="e.g. 2"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-planting-date" className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-agri-600" /> Planting date
                </Label>
                <Input
                  id="report-planting-date"
                  type="date"
                  value={form.plantingDate}
                  onChange={(e) => setForm({ ...form, plantingDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="report-water-source" className="flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-agri-600" /> Water source
                </Label>
                <Select
                  value={form.waterSource}
                  onValueChange={(value: WaterSource) => setForm({ ...form, waterSource: value })}
                >
                  <SelectTrigger id="report-water-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {waterSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {WATER_SOURCE_LABELS[source] ?? source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-seed-source">Seed source</Label>
                <Select
                  value={form.seedSource}
                  onValueChange={(value: SeedSource) => setForm({ ...form, seedSource: value })}
                >
                  <SelectTrigger id="report-seed-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {seedSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {SEED_SOURCE_LABELS[source] ?? source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-previous-crop">Previous crop (optional)</Label>
              <Input
                id="report-previous-crop"
                value={form.previousCrop}
                onChange={(e) => setForm({ ...form, previousCrop: e.target.value })}
                placeholder="e.g. Maize"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Sprout className="h-3.5 w-3.5 text-agri-600" /> Varieties to compare (up to {MAX_VARIETIES})
              </Label>
              {varieties.length === 0 ? (
                <p className="text-sm text-muted-foreground">No potato varieties available right now.</p>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      id="report-varieties"
                      type="button"
                      variant="outline"
                      className="h-10 w-full justify-between px-3 text-left font-normal"
                    >
                      <span
                        className={
                          selectedVarieties.length === 0 ? "text-muted-foreground" : "min-w-0 flex-1 truncate"
                        }
                      >
                        {varietyDropdownLabel}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto"
                  >
                    {varieties.map((variety) => {
                      const checked = form.cropVarietyIds.includes(variety.id)
                      return (
                        <DropdownMenuCheckboxItem
                          key={variety.id}
                          checked={checked}
                          onCheckedChange={() => toggleVariety(variety.id)}
                          onSelect={(event) => event.preventDefault()}
                        >
                          {variety.name}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-priority" className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-agri-600" /> What matters most to you?
              </Label>
              <Select
                value={form.priority}
                onValueChange={(value: FarmingPriority) => setForm({ ...form, priority: value })}
              >
                <SelectTrigger id="report-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {FARMING_PRIORITY_LABELS[priority] ?? priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating report…
                  </>
                ) : (
                  "Generate report"
                )}
              </Button>
              <Button type="button" variant="ghost" onClick={resetAndClose} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
