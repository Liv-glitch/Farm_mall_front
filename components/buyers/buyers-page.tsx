"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  CheckCircle2,
  Clock3,
  EyeOff,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShoppingBag,
  ShieldCheck,
  Users,
  type LucideIcon,
  XCircle,
} from "lucide-react"
import { apiClient } from "@/lib/api/client"
import type {
  BuyersDashboardData,
  BuyersIntegration,
  BuyersRegistrationDefaults,
  BuyersRegistrationForm,
  MarketplaceBooking,
  MarketplaceBookingStatus,
  MarketplaceDecision,
} from "@/lib/types/buyers"
import type { ProductionCycle } from "@/lib/types/production"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

const activeStatuses = new Set(["pending_approval", "approved", "confirmed"])

const emptyDefaults: BuyersRegistrationDefaults = {
  external_platform_ref: "",
  callback_url: "",
  full_name: "",
  phone_number: "",
  email: "",
  county: "",
  ward: "",
  specific_location: "",
  potato_variety: "",
  acreage_planted: "",
  planting_date: "",
}

function statusCopy(status?: string) {
  const normalized = status || "not_registered"
  const labels: Record<string, string> = {
    pending: "Pending review",
    pending_approval: "Pending approval",
    approved: "Approved",
    confirmed: "Confirmed",
    rejected: "Rejected",
    active: "Active",
    not_registered: "Not registered",
    not_listed: "Not listed",
  }

  return labels[normalized] || normalized.replace(/_/g, " ")
}

function statusBadgeClass(status?: string) {
  if (status === "approved" || status === "confirmed" || status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700"
  }
  return "border-amber-200 bg-amber-50 text-amber-700"
}

function bookingMessage(status: string) {
  if (status === "pending_approval") return "Buyer requested this acreage. Confirm availability before contact details are shared."
  if (status === "approved") return "Availability confirmed. Awaiting buyer confirmation and payment."
  if (status === "confirmed") return "Buyer confirmed and paid. Contact details are now available."
  if (status === "rejected") return "This booking is closed."
  return "Booking status updated by the marketplace."
}

function toDateOnly(value?: string | Date | null) {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  return date.toISOString().slice(0, 10)
}

function cycleLabel(cycle: ProductionCycle) {
  const crop = cycle.cropVariety?.name || "Unknown variety"
  const location = [cycle.farmLocationName, cycle.farmSubcounty, cycle.farmCounty].filter(Boolean).join(", ") || cycle.farmLocation
  return [crop, location].filter(Boolean).join(" - ")
}

export function buildBuyersDefaultsFromCycle(
  defaults: BuyersRegistrationDefaults,
  cycle: ProductionCycle
): BuyersRegistrationDefaults {
  return {
    ...defaults,
    production_cycle_id: cycle.id,
    external_platform_ref: `farmmall-cycle:${cycle.id}`,
    county: cycle.farmCounty || defaults.county || "",
    ward: cycle.farmSubcounty || defaults.ward || "",
    specific_location: cycle.farmLocationName || cycle.farmLocation || defaults.specific_location || "",
    potato_variety: cycle.cropVariety?.name || defaults.potato_variety || "",
    acreage_planted: cycle.landSizeAcres || defaults.acreage_planted || "",
    planting_date: toDateOnly(cycle.plantingDate || defaults.planting_date),
  }
}

export function BuyersPage({ variant = "standalone" }: { variant?: "standalone" | "embedded" } = {}) {
  const [dashboard, setDashboard] = useState<BuyersDashboardData | null>(null)
  const [cycles, setCycles] = useState<ProductionCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [cyclesLoading, setCyclesLoading] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [selectedCycleId, setSelectedCycleId] = useState("")
  const [listingFilter, setListingFilter] = useState("all")
  const [actionBookingRef, setActionBookingRef] = useState<string | null>(null)

  const loadDashboard = async (quiet = false) => {
    if (quiet) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const [data, cyclesRes] = await Promise.all([
        apiClient.getBuyersDashboard(),
        apiClient.getCycles() as Promise<{ data: ProductionCycle[] } | ProductionCycle[]>,
      ])
      setDashboard(data)
      setCycles(Array.isArray(cyclesRes) ? cyclesRes : cyclesRes.data || [])
    } catch (error: any) {
      toast({
        title: "Could not load Buyers",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
      setCyclesLoading(false)
    }
  }

  useEffect(() => {
    setCyclesLoading(true)
    loadDashboard()
  }, [])

  const integrations = useMemo(() => {
    if (dashboard?.integrations?.length) return dashboard.integrations
    return dashboard?.integration ? [dashboard.integration] : []
  }, [dashboard])

  const listedCycleIds = useMemo(
    () => new Set(integrations.map((integration) => integration.productionCycleId).filter(Boolean)),
    [integrations]
  )

  const unlistedCycles = useMemo(
    () => cycles.filter((cycle) => !listedCycleIds.has(cycle.id)),
    [cycles, listedCycleIds]
  )

  useEffect(() => {
    if (!selectedCycleId && unlistedCycles.length > 0) {
      setSelectedCycleId(unlistedCycles[0].id)
    }
    if (selectedCycleId && !unlistedCycles.some((cycle) => cycle.id === selectedCycleId)) {
      setSelectedCycleId(unlistedCycles[0]?.id || "")
    }
  }, [selectedCycleId, unlistedCycles])

  const selectedCycle = unlistedCycles.find((cycle) => cycle.id === selectedCycleId)
  const selectedDefaults = selectedCycle
    ? buildBuyersDefaultsFromCycle(dashboard?.defaults || emptyDefaults, selectedCycle)
    : dashboard?.defaults || emptyDefaults

  const bookings = dashboard?.bookings || []
  const filteredBookings = useMemo(() => {
    if (listingFilter === "all") return bookings
    return bookings.filter((booking) => booking.listing?.marketplace_farmer_id === listingFilter || booking.farmer_id === listingFilter)
  }, [bookings, listingFilter])

  const activeBookings = useMemo(
    () => filteredBookings.filter((booking) => activeStatuses.has(booking.booking_status)),
    [filteredBookings]
  )
  const historyBookings = useMemo(
    () => filteredBookings.filter((booking) => booking.booking_status === "rejected"),
    [filteredBookings]
  )

  const handleDecision = async (booking: MarketplaceBooking, decision: MarketplaceDecision) => {
    setActionBookingRef(`${booking.farmer_id}:${booking.booking_ref}`)
    try {
      const result = await apiClient.decideBuyerBooking(booking.booking_ref, decision, booking.farmer_id)
      setDashboard((current) => current ? { ...current, bookings: result.bookings } : current)
      toast({
        title: decision === "approve" ? "Booking approved" : "Booking rejected",
        description: decision === "approve"
          ? "The buyer can now confirm and pay."
          : "The marketplace has released this listing.",
      })
    } catch (error: any) {
      toast({
        title: "Booking update failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionBookingRef(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[56vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-agri-700" />
          <p className="mt-3 text-sm font-medium text-gray-600">Loading Buyers dashboard...</p>
        </div>
      </div>
    )
  }

  const totalBuyers = bookings.length
  const registeredListings = integrations.filter((integration) => integration.marketplaceFarmerId)

  return (
    <div className={cn("mx-auto w-full max-w-7xl space-y-6", variant === "embedded" && "space-y-5")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {variant === "standalone" ? (
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-agri-50 text-agri-700 ring-1 ring-agri-100">
              <ShoppingBag className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">Buyers</h1>
              <p className="mt-1 text-sm text-gray-600">Manage marketplace listing status and booking requests.</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Manage marketplace listing status and booking requests.</p>
        )}
        <Button
          type="button"
          variant="outline"
          className="w-full border-agri-200 text-agri-700 hover:bg-agri-50 sm:w-auto"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <ListFarmPanel
        cycles={unlistedCycles}
        selectedCycleId={selectedCycleId}
        cyclesLoading={cyclesLoading}
        onSelectCycle={setSelectedCycleId}
        onRegister={() => setRegisterOpen(true)}
      />

      {registeredListings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatusCard title="Listed Farms" value={String(registeredListings.length)} status="approved" icon={ShoppingBag} />
            <StatusCard title="Total Buyers" value={String(totalBuyers)} status={totalBuyers > 0 ? "confirmed" : "pending"} icon={Users} />
            <StatusCard title="Open Requests" value={String(bookings.filter((booking) => booking.booking_status === "pending_approval").length)} status="pending_approval" icon={ShieldCheck} />
          </div>

          <ListingsSummary integrations={registeredListings} bookings={bookings} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Booking requests</h2>
              <p className="text-sm text-gray-600">Review buyer activity across all listed production cycles.</p>
            </div>
            <div className="w-full sm:w-72">
              <Select value={listingFilter} onValueChange={setListingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter listings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All listings</SelectItem>
                  {registeredListings.map((integration) => (
                    <SelectItem key={integration.id} value={integration.marketplaceFarmerId || integration.id}>
                      {integration.productionCycle?.cropVarietyName || integration.externalPlatformRef}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="active" className="space-y-5">
            <TabsList>
              <TabsTrigger value="active">Active ({activeBookings.length})</TabsTrigger>
              <TabsTrigger value="history">History ({historyBookings.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              <BookingList
                bookings={activeBookings}
                emptyTitle="No active buyer bookings"
                emptyDescription="New buyer requests will appear here when the marketplace receives them."
                actionBookingRef={actionBookingRef}
                onDecision={handleDecision}
              />
            </TabsContent>
            <TabsContent value="history">
              <BookingList
                bookings={historyBookings}
                emptyTitle="No booking history yet"
                emptyDescription="Rejected bookings will be kept here until the marketplace exposes a fulfilled booking state."
                actionBookingRef={actionBookingRef}
                onDecision={handleDecision}
              />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <ShoppingBag className="mx-auto h-9 w-9 text-gray-400" />
          <h3 className="mt-3 text-base font-semibold text-gray-950">No marketplace listings yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-600">
            Select an unlisted production cycle above to send it for marketplace approval.
          </p>
        </div>
      )}

      <BuyersRegistrationModal
        open={registerOpen}
        defaults={selectedDefaults}
        onOpenChange={setRegisterOpen}
        onRegistered={() => loadDashboard(true)}
      />
    </div>
  )
}

function ListFarmPanel({
  cycles,
  selectedCycleId,
  cyclesLoading,
  onSelectCycle,
  onRegister,
}: {
  cycles: ProductionCycle[]
  selectedCycleId: string
  cyclesLoading: boolean
  onSelectCycle: (cycleId: string) => void
  onRegister: () => void
}) {
  const hasCycles = cycles.length > 0

  return (
    <div className="overflow-hidden rounded-lg border border-agri-100 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-6 sm:p-8">
          <Badge className="border-agri-200 bg-agri-50 text-agri-700 hover:bg-agri-50">Buyer marketplace</Badge>
          <h2 className="mt-5 max-w-2xl text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            Sell Your Harvest Faster. List Your Farm Today.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            Don&apos;t wait for buyers to find you. Join our marketplace to showcase your farm, connect directly with ready buyers, and secure bookings for your produce before harvest season even begins.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div>
              <Label className="text-agri-700">Production cycle</Label>
              <Select value={selectedCycleId} onValueChange={onSelectCycle} disabled={!hasCycles || cyclesLoading}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={cyclesLoading ? "Loading cycles..." : "Select an unlisted cycle"} />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycleLabel(cycle)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" className="bg-agri-700 hover:bg-agri-800" onClick={onRegister} disabled={!hasCycles}>
              List My Farm
            </Button>
          </div>
          {!hasCycles ? (
            <p className="mt-3 text-sm text-gray-600">All available production cycles are already listed, or no production cycles are ready yet.</p>
          ) : null}
        </div>
        <div className="border-t border-agri-100 bg-agri-50 p-6 lg:border-l lg:border-t-0">
          <div className="space-y-4">
            <PreviewRow label="Listings are cycle-based" value="Each production cycle gets its own marketplace listing ID." />
            <PreviewRow label="Approval" value="Admin approval happens on the marketplace." />
            <PreviewRow label="Dashboard" value="All listed cycles and bookings stay manageable here." />
          </div>
        </div>
      </div>
    </div>
  )
}

export function BuyersRegistrationModal({
  open,
  defaults,
  onOpenChange,
  onRegistered,
}: {
  open: boolean
  defaults: BuyersRegistrationDefaults
  onOpenChange: (open: boolean) => void
  onRegistered: () => void
}) {
  const [step, setStep] = useState<"intro" | "form" | "review" | "success">("intro")
  const [formData, setFormData] = useState<BuyersRegistrationForm>(defaults)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setStep("intro")
      setFormData(defaults)
      setError(null)
    }
  }, [defaults, open])

  const updateField = (field: keyof BuyersRegistrationForm, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await apiClient.registerForBuyers(formData)
      toast({
        title: "Registration submitted",
        description: "Your marketplace listing is now awaiting approval.",
      })
      setStep("success")
      onRegistered()
    } catch (submissionError: any) {
      const message = submissionError.message || "Please check the form and try again."
      setError(message)
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const close = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-agri-800">
            {step === "intro" ? "Buyer marketplace" : step === "success" ? "Listing submitted" : "Register for Buyers"}
          </DialogTitle>
          <DialogDescription>
            {step === "review"
              ? "Confirm the details that will be sent to the marketplace for admin approval."
              : step === "success"
                ? "Your production cycle has been sent to the marketplace."
                : "List this production cycle so buyers can discover and book your harvest."}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Registration failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {step === "intro" ? (
          <div className="space-y-6">
            <div>
              <Badge className="border-agri-200 bg-agri-50 text-agri-700 hover:bg-agri-50">Buyer marketplace</Badge>
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-gray-950">
                Sell Your Harvest Faster. List Your Farm Today.
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
                Don&apos;t wait for buyers to find you. Join our marketplace to showcase your farm, connect directly with ready buyers, and secure bookings for your produce before harvest season even begins.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={close}>Cancel</Button>
              <Button type="button" className="bg-agri-700 hover:bg-agri-800" onClick={() => setStep("form")}>
                List My Farm
              </Button>
            </div>
          </div>
        ) : null}

        {step === "form" ? (
          <form onSubmit={(event) => { event.preventDefault(); setStep("review") }} className="space-y-5">
            <RegistrationFields formData={formData} updateField={updateField} />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setStep("intro")}>Back</Button>
              <Button type="submit" className="bg-agri-700 hover:bg-agri-800">Review Details</Button>
            </div>
          </form>
        ) : null}

        {step === "review" ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <PreviewRow label="Farmer" value={formData.full_name || "Missing"} />
              <PreviewRow label="Phone" value={formData.phone_number || "Missing"} />
              <PreviewRow label="Email" value={formData.email || "Missing"} />
              <PreviewRow label="Location" value={[formData.specific_location, formData.ward, formData.county].filter(Boolean).join(", ") || "Missing"} />
              <PreviewRow label="Potato variety" value={formData.potato_variety || "Missing"} />
              <PreviewRow label="Acreage" value={formData.acreage_planted ? `${formData.acreage_planted} acres` : "Missing"} />
              <PreviewRow label="Planting date" value={formData.planting_date || "Missing"} />
              <PreviewRow label="Marketplace reference" value={defaults.external_platform_ref || "Generated on submit"} />
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setStep("form")} disabled={submitting}>Back</Button>
              <Button type="submit" className="bg-agri-700 hover:bg-agri-800" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm and Submit
              </Button>
            </div>
          </form>
        ) : null}

        {step === "success" ? (
          <div className="space-y-5">
            <Alert className="border-emerald-100 bg-emerald-50 text-emerald-900">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Registration submitted</AlertTitle>
              <AlertDescription>Your marketplace listing is awaiting approval. You can manage all listings from your profile page.</AlertDescription>
            </Alert>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={close}>Close</Button>
              <Button asChild className="bg-agri-700 hover:bg-agri-800">
                <Link href="/dashboard/profile">View Buyers Dashboard</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function RegistrationFields({
  formData,
  updateField,
}: {
  formData: BuyersRegistrationForm
  updateField: (field: keyof BuyersRegistrationForm, value: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="Full name" id="full_name" value={formData.full_name} onChange={updateField} required />
      <FormField label="Phone number" id="phone_number" value={formData.phone_number} onChange={updateField} required />
      <FormField label="Email" id="email" type="email" value={formData.email} onChange={updateField} required />
      <FormField label="County" id="county" value={formData.county} onChange={updateField} required />
      <FormField label="Ward" id="ward" value={formData.ward} onChange={updateField} required />
      <FormField label="Specific location" id="specific_location" value={formData.specific_location} onChange={updateField} required />
      <FormField label="Potato variety" id="potato_variety" value={formData.potato_variety} onChange={updateField} required />
      <FormField label="Acreage planted" id="acreage_planted" type="number" min="0.1" step="0.1" value={String(formData.acreage_planted)} onChange={updateField} required />
      <FormField label="Planting date" id="planting_date" type="date" value={formData.planting_date} onChange={updateField} required />
    </div>
  )
}

function FormField({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  min,
  step,
}: {
  id: keyof BuyersRegistrationForm
  label: string
  value: string
  onChange: (field: keyof BuyersRegistrationForm, value: string) => void
  type?: string
  required?: boolean
  min?: string
  step?: string
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-agri-700">{label}</Label>
      <Input
        id={id}
        type={type}
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500"
        required={required}
      />
    </div>
  )
}

function ListingsSummary({ integrations, bookings }: { integrations: BuyersIntegration[]; bookings: MarketplaceBooking[] }) {
  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-gray-950">Listed production cycles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {integrations.map((integration) => {
          const cycle = integration.productionCycle
          const buyerCount = bookings.filter((booking) => booking.farmer_id === integration.marketplaceFarmerId).length
          const location = [cycle?.farmLocationName, cycle?.farmSubcounty, cycle?.farmCounty].filter(Boolean).join(", ") || cycle?.farmLocation || "Location not set"
          return (
            <div key={integration.id} className="grid gap-3 rounded-lg border border-gray-200 p-4 md:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,0.7fr))] md:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-950">{cycle?.cropVarietyName || integration.externalPlatformRef}</p>
                <p className="mt-1 truncate text-xs text-gray-500">{location}</p>
              </div>
              <SummaryCell label="Acreage" value={cycle?.landSizeAcres ? `${cycle.landSizeAcres} acres` : "Not set"} />
              <SummaryCell label="Registration" value={statusCopy(integration.registrationStatus)} />
              <SummaryCell label="Listing" value={statusCopy(integration.listingStatus)} />
              <SummaryCell label="Buyers" value={String(buyerCount)} />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold capitalize text-gray-950">{value}</p>
    </div>
  )
}

function StatusCard({
  title,
  value,
  status,
  icon: Icon,
}: {
  title: string
  value: string
  status?: string
  icon: LucideIcon
}) {
  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-lg font-bold capitalize text-gray-950">{value}</p>
        </div>
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-lg border", statusBadgeClass(status))}>
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  )
}

function BookingList({
  bookings,
  emptyTitle,
  emptyDescription,
  actionBookingRef,
  onDecision,
}: {
  bookings: MarketplaceBooking[]
  emptyTitle: string
  emptyDescription: string
  actionBookingRef: string | null
  onDecision: (booking: MarketplaceBooking, decision: MarketplaceDecision) => void
}) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
        <Clock3 className="mx-auto h-9 w-9 text-gray-400" />
        <h3 className="mt-3 text-base font-semibold text-gray-950">{emptyTitle}</h3>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-600">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {bookings.map((booking) => (
        <BookingCard
          key={`${booking.farmer_id}:${booking.booking_ref}`}
          booking={booking}
          loading={actionBookingRef === `${booking.farmer_id}:${booking.booking_ref}`}
          onDecision={onDecision}
        />
      ))}
    </div>
  )
}

function BookingCard({
  booking,
  loading,
  onDecision,
}: {
  booking: MarketplaceBooking
  loading: boolean
  onDecision: (booking: MarketplaceBooking, decision: MarketplaceDecision) => void
}) {
  const status = booking.booking_status as MarketplaceBookingStatus
  const buyer = booking.buyer || {}
  const isConfirmed = status === "confirmed"

  return (
    <Card className="overflow-hidden border-gray-200 bg-white shadow-sm">
      <CardHeader className="space-y-0 border-b border-gray-100 bg-gray-50/60 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-agri-100 text-agri-700">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-base text-gray-950">
                {isConfirmed ? buyer.company_name || "Confirmed buyer" : "Buyer request"}
              </CardTitle>
              <p className="mt-0.5 text-xs text-gray-500">{booking.booking_ref}</p>
              {booking.listing ? (
                <p className="mt-1 text-xs font-medium text-agri-700">
                  {[booking.listing.crop_variety, booking.listing.location].filter(Boolean).join(" - ")}
                </p>
              ) : null}
            </div>
          </div>
          <Badge variant="outline" className={cn("shrink-0 capitalize", statusBadgeClass(status))}>
            {statusCopy(status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-center justify-between rounded-lg border border-agri-100 bg-agri-50 px-4 py-3">
          <span className="text-sm font-medium text-agri-800">Acreage booked</span>
          <span className="text-lg font-bold text-agri-900">{booking.acres_booked} acres</span>
        </div>

        {isConfirmed ? (
          <div className="space-y-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              Confirmed buyer details
            </div>
            {buyer.county ? (
              <div className="flex items-center gap-2 text-sm text-emerald-900">
                <MapPin className="h-4 w-4 shrink-0 text-emerald-700" />
                {buyer.county}
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <ContactLine icon={Phone} value={buyer.phone || "Phone unavailable"} />
              <ContactLine icon={Mail} value={buyer.email || "Email unavailable"} />
            </div>
          </div>
        ) : (
          <Alert className="border-agri-100 bg-agri-50 text-agri-900">
            <EyeOff className="h-4 w-4" />
            <AlertTitle>Buyer privacy protected</AlertTitle>
            <AlertDescription>{bookingMessage(status)}</AlertDescription>
          </Alert>
        )}

        {status === "pending_approval" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
              disabled={loading}
              onClick={() => onDecision(booking, "reject")}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Reject
            </Button>
            <Button
              type="button"
              className="bg-agri-700 hover:bg-agri-800"
              disabled={loading}
              onClick={() => onDecision(booking, "approve")}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Approve
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function ContactLine({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-agri-700" />
      <span className="truncate">{value}</span>
    </span>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-agri-100 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-gray-950">{value}</p>
    </div>
  )
}
