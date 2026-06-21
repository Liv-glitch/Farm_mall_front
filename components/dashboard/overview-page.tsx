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
  Sprout,
  Stethoscope,
  ThermometerSun,
  Wind,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/use-auth"
import { getWeatherRecommendation } from "@/lib/weather/recommendation"

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

export function OverviewPage() {
  const { farm, loading } = useAuth()
  const [weather, setWeather] = useState<CurrentWeather | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  const farmLocation = farm?.location?.trim()
  const hasCoordinates = typeof farm?.locationLat === "number" && typeof farm?.locationLng === "number"
  const hasLocation = hasCoordinates || !!farmLocation

  useEffect(() => {
    if (loading || !hasLocation) return

    const controller = new AbortController()
    const params = new URLSearchParams()

    if (hasCoordinates) {
      params.set("lat", String(farm?.locationLat))
      params.set("lon", String(farm?.locationLng))
    } else if (farmLocation) {
      params.set("q", farmLocation)
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
  }, [farm?.locationLat, farm?.locationLng, farmLocation, hasCoordinates, hasLocation, loading])

  const recommendation = useMemo(() => {
    if (!weather) return null
    return getWeatherRecommendation({
      temperature: weather.temperature,
      windSpeed: weather.windSpeed,
      condition: weather.condition,
    })
  }, [weather])

  return (
    <div className="space-y-6">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-agri-900">Overview</h1>
        <p className="mt-1 max-w-2xl text-sm sm:text-base text-muted-foreground">
          A quick look at local conditions and the main Farm Mall tools.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-agri-100">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Current weather</p>
                <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold text-agri-900 sm:text-2xl">
                  <CloudSun className="h-6 w-6 shrink-0 text-[#e87a3b]" />
                  <span className="truncate">{weather?.locationName || farmLocation || "Your farm"}</span>
                </h2>
              </div>
              {weather?.icon ? (
                <img
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt=""
                  className="h-14 w-14 shrink-0"
                />
              ) : null}
            </div>

            {loading || weatherLoading ? (
              <div className="mt-6 flex min-h-32 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading local weather...
              </div>
            ) : !hasLocation ? (
              <div className="mt-6 rounded-lg border border-dashed border-agri-200 bg-agri-50/40 p-5">
                <p className="font-medium text-agri-900">Add your farm location to see local weather.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your dashboard will use your farm profile to show current conditions.
                </p>
              </div>
            ) : weatherError ? (
              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
                <p className="font-medium text-amber-900">Weather is unavailable right now.</p>
                <p className="mt-1 text-sm text-amber-800">{weatherError}</p>
              </div>
            ) : weather ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-agri-50 p-3">
                  <ThermometerSun className="mb-2 h-4 w-4 text-agri-700" />
                  <div className="text-2xl font-bold text-agri-900">{formatNumber(weather.temperature, "°C")}</div>
                  <div className="text-xs capitalize text-muted-foreground">{weather.condition}</div>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <Droplets className="mb-2 h-4 w-4 text-blue-700" />
                  <div className="text-2xl font-bold text-blue-900">{formatNumber(weather.humidity, "%")}</div>
                  <div className="text-xs text-muted-foreground">Humidity</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <Wind className="mb-2 h-4 w-4 text-slate-700" />
                  <div className="text-2xl font-bold text-slate-900">{formatNumber(weather.windSpeed, " km/h")}</div>
                  <div className="text-xs text-muted-foreground">Wind speed</div>
                </div>
                <div className="rounded-lg bg-warm-50 p-3">
                  <MapPin className="mb-2 h-4 w-4 text-warm-800" />
                  <div className="truncate text-sm font-semibold text-warm-900">{farm?.name || "Farm"}</div>
                  <div className="truncate text-xs text-muted-foreground">{farmLocation || weather.locationName}</div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-agri-100 bg-agri-50/50">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm font-medium text-muted-foreground">Recommendation</p>
            <h2 className="mt-1 text-xl font-semibold text-agri-900">What to consider today</h2>
            <p className="mt-4 text-sm leading-6 text-agri-950">
              {recommendation || "Weather-based recommendations will appear after current conditions load."}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-agri-900">Quick links</h2>
          <p className="text-sm text-muted-foreground">Jump into the main areas of your farm dashboard.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {quickLinks.map((item) => (
            <Card key={item.href} className="border-agri-100 transition-colors hover:border-agri-300">
              <CardContent className="flex h-full flex-col gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-agri-100 text-agri-700">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-agri-900">{item.title}</h3>
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
