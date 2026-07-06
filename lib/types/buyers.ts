export type MarketplaceBookingStatus = "pending_approval" | "approved" | "confirmed" | "rejected"
export type MarketplaceDecision = "approve" | "reject"

export interface BuyersRegistrationForm {
  production_cycle_id?: string
  full_name: string
  phone_number: string
  email: string
  county: string
  ward: string
  specific_location: string
  potato_variety: string
  acreage_planted: number | string
  planting_date: string
}

export interface BuyersRegistrationDefaults extends BuyersRegistrationForm {
  external_platform_ref: string
  callback_url: string
}

export interface BuyersIntegration {
  id: string
  userId: string
  farmId?: string | null
  productionCycleId?: string | null
  marketplaceFarmerId?: string | null
  externalPlatformRef: string
  registrationStatus: string
  listingStatus: string
  lastSyncedAt?: string | null
  lastCallbackEvent?: string | null
  createdAt: string
  updatedAt: string
  productionCycle?: {
    id: string
    farmId?: string | null
    cropVarietyName?: string | null
    landSizeAcres?: number | null
    farmLocation?: string | null
    farmCounty?: string | null
    farmSubcounty?: string | null
    farmLocationName?: string | null
    plantingDate?: string | null
    status?: string
  } | null
}

export interface MarketplaceBooking {
  booking_ref: string
  farmer_id: string
  acres_booked: number
  price_per_acre: number
  total_amount: number
  payment_status: string
  booking_status: MarketplaceBookingStatus | string
  farmer_confirmed_at?: string | null
  payment_requested_at?: string | null
  received_confirmed_at?: string | null
  buyer?: {
    company_name?: string
    phone?: string | null
    email?: string | null
    county?: string
  }
  buyer_contact_hidden?: boolean
  listing?: {
    integration_id: string
    production_cycle_id?: string | null
    marketplace_farmer_id?: string | null
    crop_variety?: string | null
    acreage_planted?: number | null
    location?: string | null
  }
}

export interface BuyersDashboardData {
  registered: boolean
  integration: BuyersIntegration | null
  integrations?: BuyersIntegration[]
  farmer?: Record<string, any>
  defaults: BuyersRegistrationDefaults
  bookings: MarketplaceBooking[]
}
