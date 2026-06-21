import { NextResponse } from "next/server"

const OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"

function getSearchParams(request: Request) {
  const { searchParams } = new URL(request.url)
  return {
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
    q: searchParams.get("q"),
  }
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
  const params = new URLSearchParams({
    appid: apiKey,
    units: "metric",
  })

  if (lat && lon) {
    params.set("lat", lat)
    params.set("lon", lon)
  } else if (q) {
    params.set("q", q)
  } else {
    return NextResponse.json(
      { message: "A farm location is required." },
      { status: 400 }
    )
  }

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
      locationName: [data.name, data.sys?.country].filter(Boolean).join(", "),
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
