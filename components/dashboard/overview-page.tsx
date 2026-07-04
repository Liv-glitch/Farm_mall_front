"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Activity,
  CalendarDays,
  Calculator,
  CloudSun,
  Droplets,
  Loader2,
  MapPin,
  Search,
  ShoppingBag,
  Sprout,
  Stethoscope,
  ThermometerSun,
  Wind,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api/client"
import type { Activity as CycleActivity, ProductionCycle } from "@/lib/types/production"
import { useAuth } from "@/lib/hooks/use-auth"
import { getWeatherRecommendation } from "@/lib/weather/recommendation"
import { getNextCalendarItem, getNextCalendarItemAfter, type ProductionCalendarItem } from "@/lib/production/activity-calendar"

interface CurrentWeather {
  locationName: string
  temperature: number
  condition: string
  icon?: string
  humidity: number
  windSpeed: number
}

const quickLinks = [
  {
    title: "Farm Preparations",
    description: "Plan the work before planting day.",
    href: "/dashboard/pre-production-planning",
    icon: Sprout,
  },
  {
    title: "Crop Tracker",
    description: "Follow crop progress and activities.",
    href: "/dashboard/cycles",
    icon: Activity,
  },
  {
    title: "Events",
    description: "Find trainings and community sessions.",
    href: "/dashboard/events",
    icon: CalendarDays,
  },
  {
    title: "Diagnosis",
    description: "Check crop health from photos.",
    href: "/dashboard/diagnosis",
    icon: Stethoscope,
  },
  {
    title: "Farm Tools",
    description: "Use calculators and forecasts.",
    href: "/dashboard/farm-tools",
    icon: Calculator,
  },
]

function formatNumber(value: number | undefined, suffix: string) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—"
  return `${Math.round(value)}${suffix}`
}

function formatActivityDate(value?: string | Date | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric" }).format(date)
}

function formatActivityLabel(activity?: CycleActivity | ProductionCalendarItem | null) {
  if (!activity) return "Not scheduled"
  const date = "scheduledDate" in activity ? formatActivityDate(activity.scheduledDate) : formatActivityDate(activity.date)
  const label = "name" in activity ? activity.name : activity.description || activity.type.replace(/_/g, " ")
  return [label, date].filter(Boolean).join(" · ")
}

function getCycleActivities(cycle?: ProductionCycle | null) {
  const activities = cycle?.activities || []
  const now = new Date().getTime()
  const validActivities = activities
    .map((activity) => ({ activity, time: new Date(activity.scheduledDate).getTime() }))
    .filter(({ time }) => Number.isFinite(time))

  const current =
    validActivities
      .filter(({ activity, time }) => activity.status === "in_progress" && time <= now)
      .sort((a, b) => b.time - a.time)[0]?.activity ||
    validActivities
      .filter(({ activity }) => activity.status === "completed")
      .sort((a, b) => b.time - a.time)[0]?.activity ||
    validActivities
      .filter(({ activity }) => activity.status === "in_progress")
      .sort((a, b) => a.time - b.time)[0]?.activity ||
    null

  const currentDate = current?.scheduledDate ? new Date(current.scheduledDate) : null
  const next =
    cycle && currentDate && !Number.isNaN(currentDate.getTime())
      ? getNextCalendarItemAfter(cycle, activities, currentDate)
      : cycle
        ? getNextCalendarItem(cycle, activities)
        : null

  return { current, next }
}

function getCycleLocationName(cycle?: ProductionCycle | null) {
  if (!cycle) return ""
  const composedLocation = [cycle.farmLocationName, cycle.farmSubcounty, cycle.farmCounty]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ")
  return (
    cycle.farmLocation?.trim() ||
    composedLocation ||
    "Production cycle location"
  )
}

export function OverviewPage() {
  const { farm, loading } = useAuth()
  const [weather, setWeather] = useState<CurrentWeather | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [cycles, setCycles] = useState<ProductionCycle[]>([])
  const [cyclesLoading, setCyclesLoading] = useState(true)
  const [selectedCycleId, setSelectedCycleId] = useState<string>("")

  const farmLocation = farm?.location?.trim()
  const locatedCycles = useMemo(
    () =>
      cycles.filter((cycle) => {
        const lat = Number(cycle.farmLocationLat)
        const lng = Number(cycle.farmLocationLng)
        const canShow = cycle.status !== "harvested" && cycle.status !== "archived"
        return canShow && (!!cycle.farmLocation?.trim() || (Number.isFinite(lat) && Number.isFinite(lng)))
      }),
    [cycles]
  )
  const selectedCycle = locatedCycles.find((cycle) => cycle.id === selectedCycleId) || locatedCycles[0]
  const weatherUsesCycle = !!selectedCycle
  const selectedCycleLocationName = getCycleLocationName(selectedCycle)
  const weatherLocation = weatherUsesCycle ? selectedCycleLocationName : farmLocation
  const weatherLat = weatherUsesCycle ? Number(selectedCycle.farmLocationLat) : farm?.locationLat
  const weatherLng = weatherUsesCycle ? Number(selectedCycle.farmLocationLng) : farm?.locationLng
  const hasCoordinates = Number.isFinite(weatherLat) && Number.isFinite(weatherLng)
  const hasLocation = hasCoordinates || !!weatherLocation
  const selectedCycleActivities = getCycleActivities(selectedCycle)

  useEffect(() => {
    if (loading) return

    let cancelled = false
    setCyclesLoading(true)

    apiClient
      .getCycles()
      .then((data) => {
        if (!cancelled) setCycles(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setCycles([])
      })
      .finally(() => {
        if (!cancelled) setCyclesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [loading])

  useEffect(() => {
    if (!selectedCycleId && locatedCycles[0]?.id) {
      setSelectedCycleId(locatedCycles[0].id)
    } else if (selectedCycleId && !locatedCycles.some((cycle) => cycle.id === selectedCycleId)) {
      setSelectedCycleId(locatedCycles[0]?.id || "")
    }
  }, [locatedCycles, selectedCycleId])

  useEffect(() => {
    if (loading || cyclesLoading || !hasLocation) return

    const controller = new AbortController()
    const params = new URLSearchParams()

    if (hasCoordinates) {
      params.set("lat", String(weatherLat))
      params.set("lon", String(weatherLng))
    } else if (weatherLocation) {
      params.set("q", weatherLocation)
    }

    setWeatherLoading(true)
    setWeatherError(null)

    fetch(`/api/weather/current?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(data?.message || "Could not load weather.")
        }
        return data as CurrentWeather
      })
      .then(setWeather)
      .catch((error) => {
        if (error.name !== "AbortError") {
          setWeather(null)
          setWeatherError(error.message || "Could not load weather.")
        }
      })
      .finally(() => setWeatherLoading(false))

    return () => controller.abort()
  }, [cyclesLoading, hasCoordinates, hasLocation, loading, weatherLat, weatherLng, weatherLocation])

  const recommendation = useMemo(() => {
    if (!weather) return null
    return getWeatherRecommendation({
      temperature: weather.temperature,
      windSpeed: weather.windSpeed,
      condition: weather.condition,
    })
  }, [weather])

  const observedAt = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date())

  return (
    <div className="page-shell">
      <div className="min-w-0">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">
          A quick look at local conditions and the main Farm Mall tools.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-700 text-white shadow-lift">
          <CardContent className="relative p-5 sm:p-7">
            {loading || cyclesLoading || weatherLoading ? (
              <div className="mt-6 flex min-h-32 items-center justify-center text-white/75">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading local weather...
              </div>
            ) : !hasLocation ? (
              <div className="mt-6 rounded-2xl bg-white/10 p-5">
                <p className="font-bold text-white">Add your farm location to see local weather.</p>
                <p className="mt-1 text-sm text-white/75">
                  Your dashboard will use your farm profile to show current conditions.
                </p>
              </div>
            ) : weatherError ? (
              <div className="mt-6 rounded-2xl bg-amber-300/20 p-5">
                <p className="font-bold text-white">Weather is unavailable right now.</p>
                <p className="mt-1 text-sm text-white/75">{weatherError}</p>
              </div>
            ) : weather ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
                      <MapPin className="h-3.5 w-3.5" />
                      Current weather
                    </p>
                    <h2 className="mt-4 flex items-center gap-2 text-lg font-bold text-white sm:text-2xl">
                      <CloudSun className="h-6 w-6 shrink-0 text-primary-100" />
                      {weatherUsesCycle && selectedCycle ? (
                        <Link
                          href={`/dashboard/cycles/${selectedCycle.id}`}
                          className="min-w-0 truncate underline decoration-white/50 underline-offset-4 hover:decoration-white"
                        >
                          Weather for {selectedCycleLocationName}
                        </Link>
                      ) : (
                        <span className="truncate">Weather for {weather?.locationName || weatherLocation || "Your farm"}</span>
                      )}
                    </h2>
                  </div>
                  {weather?.icon ? (
                    <img
                      src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                      alt=""
                      className="h-16 w-16 shrink-0 drop-shadow-lg"
                    />
                  ) : null}
                </div>

                {locatedCycles.length > 1 ? (
                  <Select value={selectedCycle?.id || ""} onValueChange={setSelectedCycleId}>
                    <SelectTrigger className="border-white/20 bg-white/10 text-white">
                      <SelectValue placeholder="Choose production cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      {locatedCycles.map((cycle) => (
                        <SelectItem key={cycle.id} value={cycle.id}>
                          {getCycleLocationName(cycle)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-white/10 p-4 backdrop-blur">
                    <ThermometerSun className="mb-2 h-4 w-4 text-primary-100" />
                    <div className="text-2xl font-extrabold">{formatNumber(weather.temperature, "°C")}</div>
                    <div className="text-xs capitalize text-white/65">{weather.condition}</div>
                  </div>
                  <div className="rounded-lg bg-white/10 p-4 backdrop-blur">
                    <Droplets className="mb-2 h-4 w-4 text-primary-100" />
                    <div className="text-2xl font-extrabold">{formatNumber(weather.humidity, "%")}</div>
                    <div className="text-xs text-white/65">Humidity</div>
                  </div>
                  <div className="rounded-lg bg-white/10 p-4 backdrop-blur">
                    <Wind className="mb-2 h-4 w-4 text-primary-100" />
                    <div className="text-2xl font-extrabold">{formatNumber(weather.windSpeed, " km/h")}</div>
                    <div className="text-xs text-white/65">Wind speed</div>
                  </div>
                </div>

                <div className="grid gap-3 rounded-lg bg-white/10 p-4 backdrop-blur sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-bold uppercase text-white/60">Current activity</div>
                    <div className="mt-1 font-semibold text-white">{formatActivityLabel(selectedCycleActivities.current)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase text-white/60">Next activity</div>
                    <div className="mt-1 font-semibold text-white">{formatActivityLabel(selectedCycleActivities.next)}</div>
                  </div>
                </div>

                <p className="text-xs text-white/60">Updated {observedAt}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm font-bold text-primary-700">Recommendation</p>
            <h2 className="mt-1 text-xl font-extrabold text-primary-900">What to consider today</h2>
            <p className="mt-4 text-sm leading-6 text-agri-950">
              {recommendation || "Weather-based recommendations will appear after current conditions load."}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Button
                type="button"
                onClick={() => window.open("https://findfarmers.onrender.com/#/register-farmer", "_blank")}
                className="w-full bg-maize-500 text-primary-950 hover:bg-maize-400"
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Find Market
              </Button>
              <Button
                type="button"
                onClick={() => window.open("https://findfarmers.onrender.com", "_blank")}
                className="w-full bg-maize-500 text-primary-950 hover:bg-maize-400"
              >
                <Search className="mr-2 h-4 w-4" />
                Find Inputs
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-extrabold text-primary-900">Quick links</h2>
          <p className="text-sm text-muted-foreground">Jump into the main areas of your farm dashboard.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {quickLinks.map((item) => (
            <Card key={item.href} className="border-0 transition-all hover:-translate-y-1 hover:shadow-card">
              <CardContent className="flex h-full flex-col gap-4 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-primary-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Button asChild variant="outline" className="h-11 w-full">
                  <Link href={item.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
