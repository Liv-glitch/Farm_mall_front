import { NextResponse } from "next/server"

const OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
const OPENWEATHER_GEOCODING_URL = "https://api.openweathermap.org/geo/1.0/direct"

interface Coordinates {
  lat: number
  lon: number
  label?: string
}

interface GeocodingResult {
  name?: string
  lat?: number
  lon?: number
  country?: string
  state?: string
}

function getSearchParams(request: Request) {
  const { searchParams } = new URL(request.url)
  return {
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
    q: searchParams.get("q"),
  }
}

function isValidCoordinate(value: string | null, min: number, max: number) {
  if (!value) return false
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue >= min && numberValue <= max
}

function buildLocationQueries(location: string) {
  const parts = location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)

  const queries = [
    location,
    parts.join(", "),
    parts.slice(1).join(", "),
    parts.slice(-1)[0],
    ...parts.slice().reverse(),
  ]
    .map((query) => query.trim())
    .filter(Boolean)

  return Array.from(
    new Set(
      queries.flatMap((query) => [
        query,
        `${query}, KE`,
      ])
    )
  )
}

async function geocodeLocation(location: string, apiKey: string): Promise<Coordinates | null> {
  for (const query of buildLocationQueries(location)) {
    const params = new URLSearchParams({
      appid: apiKey,
      limit: "5",
      q: query,
    })

    try {
      const response = await fetch(`${OPENWEATHER_GEOCODING_URL}?${params.toString()}`, {
        next: { revalidate: 60 * 60 * 24 },
      })

      if (!response.ok) continue

      const results = (await response.json().catch(() => [])) as GeocodingResult[]
      const match = results.find(
        (result) =>
          typeof result.lat === "number" &&
          typeof result.lon === "number" &&
          (!result.country || result.country === "KE")
      )

      if (match?.lat !== undefined && match.lon !== undefined) {
        return {
          lat: match.lat,
          lon: match.lon,
          label: [match.name, match.state, match.country].filter(Boolean).join(", "),
        }
      }
    } catch {
      continue
    }
  }

  return null
}

export async function GET(request: Request) {
  const apiKey = process.env.OPENWEATHER_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { message: "OpenWeatherMap API key is not configured." },
      { status: 500 }
    )
  }

  const { lat, lon, q } = getSearchParams(request)
  let coordinates: Coordinates | null = null

  if (isValidCoordinate(lat, -90, 90) && isValidCoordinate(lon, -180, 180)) {
    coordinates = { lat: Number(lat), lon: Number(lon) }
  } else if (q) {
    coordinates = await geocodeLocation(q, apiKey)
  } else {
    return NextResponse.json(
      { message: "A farm location is required." },
      { status: 400 }
    )
  }

  if (!coordinates) {
    return NextResponse.json(
      { message: `Could not find weather coordinates for "${q}". Add exact coordinates or use a nearby town/county.` },
      { status: 404 }
    )
  }

  const params = new URLSearchParams({
    appid: apiKey,
    units: "metric",
    lat: String(coordinates.lat),
    lon: String(coordinates.lon),
  })

  try {
    const response = await fetch(`${OPENWEATHER_URL}?${params.toString()}`, {
      next: { revalidate: 1800 },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => null)
      return NextResponse.json(
        { message: error?.message || "Unable to fetch current weather." },
        { status: response.status }
      )
    }

    const data = await response.json()
    const condition = data.weather?.[0]

    return NextResponse.json({
      locationName: [data.name, data.sys?.country].filter(Boolean).join(", ") || coordinates.label,
      temperature: data.main?.temp,
      condition: condition?.description || "Current conditions",
      icon: condition?.icon,
      humidity: data.main?.humidity,
      windSpeed: typeof data.wind?.speed === "number" ? data.wind.speed * 3.6 : undefined,
    })
  } catch {
    return NextResponse.json(
      { message: "Unable to reach OpenWeatherMap right now." },
      { status: 502 }
    )
  }
}
