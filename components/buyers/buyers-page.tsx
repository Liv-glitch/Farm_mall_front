"use client"

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
  type LucideIcon,
  XCircle,
} from "lucide-react"
import { apiClient } from "@/lib/api/client"
import type {
  BuyersDashboardData,
  BuyersRegistrationDefaults,
  BuyersRegistrationForm,
  MarketplaceBooking,
  MarketplaceBookingStatus,
  MarketplaceDecision,
} from "@/lib/types/buyers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

const currencyFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
})

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

export function BuyersPage() {
  const [dashboard, setDashboard] = useState<BuyersDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [actionBookingRef, setActionBookingRef] = useState<string | null>(null)

  const loadDashboard = async (quiet = false) => {
    if (quiet) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const data = await apiClient.getBuyersDashboard()
      setDashboard(data)
    } catch (error: any) {
      toast({
        title: "Could not load Buyers",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const bookings = dashboard?.bookings || []
  const activeBookings = useMemo(
    () => bookings.filter((booking) => activeStatuses.has(booking.booking_status)),
    [bookings]
  )
  const historyBookings = useMemo(
    () => bookings.filter((booking) => booking.booking_status === "rejected"),
    [bookings]
  )

  const handleDecision = async (booking: MarketplaceBooking, decision: MarketplaceDecision) => {
    setActionBookingRef(booking.booking_ref)
    try {
      const result = await apiClient.decideBuyerBooking(booking.booking_ref, decision)
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

  const integration = dashboard?.integration

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-agri-50 text-agri-700 ring-1 ring-agri-100">
              <ShoppingBag className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">Buyers</h1>
              <p className="mt-1 text-sm text-gray-600">Manage marketplace listing status and booking requests.</p>
            </div>
          </div>
        </div>
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

      {!dashboard?.registered ? (
        <MarketplaceOnboarding
          defaults={dashboard?.defaults || emptyDefaults}
          onRegister={() => setRegisterOpen(true)}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatusCard
              title="Registration"
              value={statusCopy(integration?.registrationStatus)}
              status={integration?.registrationStatus}
              icon={ShieldCheck}
            />
            <StatusCard
              title="Listing"
              value={statusCopy(integration?.listingStatus)}
              status={integration?.listingStatus}
              icon={ShoppingBag}
            />
            <StatusCard
              title="Marketplace ID"
              value={integration?.marketplaceFarmerId || "Pending"}
              status={integration?.marketplaceFarmerId ? "confirmed" : "pending"}
              icon={CheckCircle2}
            />
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
      )}

      <RegistrationModal
        open={registerOpen}
        defaults={dashboard?.defaults || emptyDefaults}
        onOpenChange={setRegisterOpen}
        onRegistered={() => loadDashboard(true)}
      />
    </div>
  )
}

function MarketplaceOnboarding({
  defaults,
  onRegister,
}: {
  defaults: BuyersRegistrationDefaults
  onRegister: () => void
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-agri-100 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-6 sm:p-8">
          <Badge className="border-agri-200 bg-agri-50 text-agri-700 hover:bg-agri-50">
            Buyer marketplace
          </Badge>
          <h2 className="mt-5 max-w-2xl text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            List your farm where verified buyers can request bookings.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            Register once from Farm Mall and keep managing buyer requests here. Your contact details stay private until you approve availability and the buyer confirms.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button type="button" className="bg-agri-700 hover:bg-agri-800" onClick={onRegister}>
              Register for Buyers
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ShieldCheck className="h-4 w-4 text-agri-700" />
              Admin approval happens on the marketplace.
            </div>
          </div>
        </div>
        <div className="border-t border-agri-100 bg-agri-50 p-6 lg:border-l lg:border-t-0">
          <div className="space-y-4">
            <PreviewRow label="Farmer" value={defaults.full_name || "Profile name needed"} />
            <PreviewRow label="Location" value={[defaults.specific_location, defaults.county].filter(Boolean).join(", ") || "Farm location needed"} />
            <PreviewRow label="Crop" value={defaults.potato_variety || "Potato variety needed"} />
            <PreviewRow label="Acreage" value={defaults.acreage_planted ? `${defaults.acreage_planted} acres` : "Acreage needed"} />
          </div>
        </div>
      </div>
    </div>
  )
}

function RegistrationModal({
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
  const [formData, setFormData] = useState<BuyersRegistrationForm>(defaults)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setFormData(defaults)
      setError(null)
    }
  }, [defaults, open])

  const updateField = (field: keyof BuyersRegistrationForm, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await apiClient.registerForBuyers(formData)
      toast({
        title: "Registration submitted",
        description: "Your marketplace listing is now awaiting approval.",
      })
      onOpenChange(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-agri-800">Register for Buyers</DialogTitle>
          <DialogDescription>
            Confirm the details that will be sent to the marketplace for admin approval.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Registration failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
            Marketplace reference: {defaults.external_platform_ref || "Generated on submit"}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-agri-700 hover:bg-agri-800" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm and Register
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
          key={booking.booking_ref}
          booking={booking}
          loading={actionBookingRef === booking.booking_ref}
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

  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base text-gray-950">{buyer.company_name || "Buyer request"}</CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span>{booking.booking_ref}</span>
              {buyer.county ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {buyer.county}
                </span>
              ) : null}
            </div>
          </div>
          <Badge variant="outline" className={cn("capitalize", statusBadgeClass(status))}>
            {statusCopy(status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3">
          <Metric label="Acres" value={String(booking.acres_booked)} />
          <Metric label="Per acre" value={currencyFormatter.format(Number(booking.price_per_acre || 0))} />
          <Metric label="Total" value={currencyFormatter.format(Number(booking.total_amount || 0))} />
        </div>

        <Alert className="border-agri-100 bg-agri-50 text-agri-900">
          {status === "confirmed" ? <CheckCircle2 className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          <AlertTitle>{status === "confirmed" ? "Confirmed booking" : "Buyer privacy protected"}</AlertTitle>
          <AlertDescription>{bookingMessage(status)}</AlertDescription>
        </Alert>

        {status === "confirmed" ? (
          <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2">
            <ContactLine icon={Phone} value={buyer.phone || "Phone unavailable"} />
            <ContactLine icon={Mail} value={buyer.email || "Email unavailable"} />
          </div>
        ) : null}

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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-gray-950">{value}</p>
    </div>
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
