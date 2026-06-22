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
            <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-primary-300/20 blur-3xl" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
                  <MapPin className="h-3.5 w-3.5" />
                  Current weather
                </p>
                <h2 className="mt-4 flex items-center gap-2 text-lg font-bold text-white sm:text-2xl">
                  <CloudSun className="h-6 w-6 shrink-0 text-primary-100" />
                  <span className="truncate">{weather?.locationName || farmLocation || "Your farm"}</span>
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

            {loading || weatherLoading ? (
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
              <>
                <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <div className="flex items-start gap-1">
                      <span className="text-6xl font-extrabold leading-none tracking-tight sm:text-7xl">
                        {formatNumber(weather.temperature, "")}
                      </span>
                      <span className="mt-2 text-2xl font-bold text-white/80">°C</span>
                    </div>
                    <p className="mt-2 text-sm font-medium capitalize text-white/75">{weather.condition}</p>
                  </div>
                  <p className="max-w-xs text-sm text-white/70 sm:text-right">{observedAt}</p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <Droplets className="mb-2 h-4 w-4 text-primary-100" />
                    <div className="text-xl font-extrabold">{formatNumber(weather.humidity, "%")}</div>
                    <div className="text-xs text-white/65">Humidity</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <Wind className="mb-2 h-4 w-4 text-primary-100" />
                    <div className="text-xl font-extrabold">{formatNumber(weather.windSpeed, " km/h")}</div>
                    <div className="text-xs text-white/65">Wind speed</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <ThermometerSun className="mb-2 h-4 w-4 text-primary-100" />
                    <div className="truncate text-sm font-extrabold">{farm?.name || "Farm"}</div>
                    <div className="truncate text-xs text-white/65">{farmLocation || weather.locationName}</div>
                  </div>
                </div>
              </>
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
