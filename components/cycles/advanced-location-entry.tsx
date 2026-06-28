"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { importLibrary, setOptions } from "@googlemaps/js-api-loader"
import {
  TerraDraw,
  TerraDrawModeUndoRedo,
  TerraDrawPolygonMode,
  TerraDrawUndoRedoKeyboardShortcuts,
} from "terra-draw"
import { TerraDrawGoogleMapsAdapter } from "terra-draw-google-maps-adapter"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, MapPin, Plus, RotateCcw, Save, Search, Trash2, Undo2 } from "lucide-react"

export type BoundaryPoint = { lat: number; lng: number }
type BoundaryRow = { lat: string; lng: string }
type MapStatus = "idle" | "loading" | "ready" | "failed"
type MapLogLevel = "info" | "warn" | "error"

interface AdvancedLocationEntryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  county: string
  subcounty: string
  locationName: string
  latitude: number | null
  longitude: number | null
  boundary: BoundaryPoint[]
  onSave: (data: {
    latitude: number | null
    longitude: number | null
    boundary: BoundaryPoint[]
  }) => void
}

const DEFAULT_CENTER = { lat: -0.3031, lng: 36.08 }
const SQM_PER_ACRE = 4046.8564224
const EMPTY_BOUNDARY_ROW_COUNT = 4
const MAP_LOAD_TIMEOUT_MS = 12000
const MAP_FAILURE_MESSAGE =
  "Google Maps did not render. Check that the browser key allows this domain, billing is active, and Maps JavaScript plus Places APIs are enabled"
const MAP_LOG_PREFIX = "[AdvancedLocationEntry:GoogleMaps]"
const MAP_DIAGNOSTIC_MARKER = "map-diagnostics-2026-06-27.2"

function createEmptyBoundaryRows(count = EMPTY_BOUNDARY_ROW_COUNT): BoundaryRow[] {
  return Array.from({ length: count }, () => ({ lat: "", lng: "" }))
}

function formatCoordinate(value: number) {
  return Number.isFinite(value) ? value.toFixed(6) : ""
}

function boundaryPointsToRows(points: BoundaryPoint[]): BoundaryRow[] {
  if (points.length === 0) return createEmptyBoundaryRows()
  return points.map((point) => ({
    lat: formatCoordinate(point.lat),
    lng: formatCoordinate(point.lng),
  }))
}

function parseBoundaryRows(rows: BoundaryRow[]): { points: BoundaryPoint[]; error: string | null } {
  const filledRows = rows.filter((row) => row.lat.trim() || row.lng.trim())

  for (const row of filledRows) {
    if (!row.lat.trim() || !row.lng.trim()) {
      return { points: [], error: "Each boundary row needs both latitude and longitude." }
    }
  }

  const points = filledRows.map((row) => ({
    lat: Number(row.lat),
    lng: Number(row.lng),
  }))

  const invalidPoint = points.find(
    (point) =>
      !Number.isFinite(point.lat) ||
      !Number.isFinite(point.lng) ||
      point.lat < -90 ||
      point.lat > 90 ||
      point.lng < -180 ||
      point.lng > 180
  )

  if (invalidPoint) {
    return { points: [], error: "Boundary coordinates must use valid latitude and longitude values." }
  }

  if (points.length > 0 && points.length < 3) {
    return { points, error: "A farm boundary needs at least 3 points." }
  }

  return { points, error: null }
}

function getBoundaryCentroid(points: BoundaryPoint[]): BoundaryPoint | null {
  if (points.length === 0) return null
  const total = points.reduce(
    (sum, point) => ({
      lat: sum.lat + point.lat,
      lng: sum.lng + point.lng,
    }),
    { lat: 0, lng: 0 }
  )

  return {
    lat: total.lat / points.length,
    lng: total.lng / points.length,
  }
}

function getPolygonPoints(draw: TerraDraw): BoundaryPoint[] {
  const polygon = draw
    .getSnapshot()
    .find((feature) => feature.geometry.type === "Polygon")

  if (!polygon || polygon.geometry.type !== "Polygon") return []

  const ring = (polygon.geometry.coordinates[0] || []) as number[][]
  return ring
    .map(([lng, lat]: number[]) => ({ lat, lng }))
    .filter((point: BoundaryPoint, index: number, points: BoundaryPoint[]) => {
      if (index !== points.length - 1) return true
      const first = points[0]
      return !(first && first.lat === point.lat && first.lng === point.lng)
    })
}

function formatArea(areaAcres: number | null) {
  if (!areaAcres || areaAcres <= 0) return null
  if (areaAcres < 1) return `${areaAcres.toFixed(2)} acres`
  return `${areaAcres.toFixed(1)} acres`
}

function isValidCoordinatePair(latValue: string, lngValue: string) {
  const lat = Number(latValue)
  const lng = Number(lngValue)

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return error
}

function isGoogleMapsRuntimeMessage(value: unknown) {
  if (typeof value !== "string") return false
  return /google maps|google\.maps|maps\.googleapis\.com|maps javascript api/i.test(value)
}

function normalizeApiKey(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || ""
}

function getMapDomSnapshot(container: HTMLDivElement | null) {
  if (!container) {
    return {
      hasContainer: false,
      width: 0,
      height: 0,
      childCount: 0,
      hasGoogleMapShell: false,
      imageCount: 0,
      tileImageCount: 0,
      hasAttribution: false,
      text: "",
    }
  }

  const images = Array.from(container.querySelectorAll("img"))
  return {
    hasContainer: true,
    width: container.offsetWidth,
    height: container.offsetHeight,
    childCount: container.childElementCount,
    hasGoogleMapShell: Boolean(container.querySelector(".gm-style")),
    imageCount: images.length,
    tileImageCount: images.filter((image) => /googleapis|ggpht|googleusercontent/i.test(image.src)).length,
    hasAttribution: /Google|Map data|Terms/i.test(container.textContent || ""),
    text: (container.textContent || "").trim().slice(0, 300),
  }
}

function logMapDiagnostic(level: MapLogLevel, message: string, context: Record<string, unknown> = {}) {
  const payload = {
    component: "AdvancedLocationEntry",
    feature: "google-maps-location-entry",
    message,
    context,
    href: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    timestamp: new Date().toISOString(),
  }

  const logger = level === "error" ? console.error : level === "warn" ? console.warn : console.info
  logger(MAP_LOG_PREFIX, payload)

  if (typeof navigator !== "undefined" && typeof Blob !== "undefined") {
    const body = JSON.stringify({ level, ...payload })
    const blob = new Blob([body], { type: "application/json" })
    if (navigator.sendBeacon("/api/client-diagnostics", blob)) return
  }

  void fetch("/api/client-diagnostics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level, ...payload }),
    keepalive: true,
  }).catch((error) => {
    console.warn(MAP_LOG_PREFIX, "Could not mirror map diagnostic to server stderr", serializeError(error))
  })
}

export function AdvancedLocationEntry({
  open,
  onOpenChange,
  county,
  subcounty,
  locationName,
  latitude,
  longitude,
  boundary,
  onSave,
}: AdvancedLocationEntryProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const drawRef = useRef<TerraDraw | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const mapsRef = useRef<typeof google.maps | null>(null)
  const previewPolygonRef = useRef<google.maps.Polygon | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)

  const [mapStatus, setMapStatus] = useState<MapStatus>("idle")
  const [mapsError, setMapsError] = useState<string | null>(null)
  const [tileWarning, setTileWarning] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [mapDiagnosticText, setMapDiagnosticText] = useState("Map diagnostics have not started.")
  const [mapContainerElement, setMapContainerElement] = useState<HTMLDivElement | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [manualLat, setManualLat] = useState(latitude?.toString() || "")
  const [manualLng, setManualLng] = useState(longitude?.toString() || "")
  const [points, setPoints] = useState<BoundaryPoint[]>(boundary)
  const [manualBoundaryRows, setManualBoundaryRows] = useState<BoundaryRow[]>(boundaryPointsToRows(boundary))
  const [manualBoundaryError, setManualBoundaryError] = useState<string | null>(null)
  const mapStatusRef = useRef<MapStatus>("idle")

  const apiKey = normalizeApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

  const approximateQuery = useMemo(
    () => [locationName, subcounty, county, "Kenya"].filter(Boolean).join(", "),
    [county, locationName, subcounty]
  )

  const hasValidCoordinates = isValidCoordinatePair(manualLat, manualLng)
  const mapsReady = mapStatus === "ready"

  const setMapContainer = useCallback((node: HTMLDivElement | null) => {
    mapContainerRef.current = node
    setMapContainerElement(node)
  }, [])

  useEffect(() => {
    mapStatusRef.current = mapStatus
  }, [mapStatus])

  const reportMapDiagnostic = (
    level: MapLogLevel,
    message: string,
    context: Record<string, unknown> = {}
  ) => {
    setMapDiagnosticText(message)
    logMapDiagnostic(level, message, {
      marker: MAP_DIAGNOSTIC_MARKER,
      mapStatus: mapStatusRef.current,
      dom: getMapDomSnapshot(mapContainerRef.current),
      ...context,
    })
  }

  useEffect(() => {
    if (!open) return
    setManualLat(latitude?.toString() || "")
    setManualLng(longitude?.toString() || "")
    setPoints(boundary)
    setManualBoundaryRows(boundaryPointsToRows(boundary))
    setManualBoundaryError(null)
    setSearchQuery(approximateQuery)
    setSearchError(null)
    setMapDiagnosticText(`${MAP_DIAGNOSTIC_MARKER}: component opened`)
  }, [approximateQuery, boundary, latitude, longitude, open])

  useEffect(() => {
    if (open && !apiKey) {
      reportMapDiagnostic("warn", "Google Maps browser key is missing", {
        expectedEnv: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
      })
    }
  }, [apiKey, open])

  useEffect(() => {
    if (!open) return

    const checkContainer = () => {
      const dom = getMapDomSnapshot(mapContainerRef.current)

      if (!dom.hasContainer) {
        reportMapDiagnostic("error", "Map container ref is missing after dialog opened", {
          hasApiKey: Boolean(apiKey),
        })
        return
      }

      if (dom.width === 0 || dom.height === 0) {
        reportMapDiagnostic("error", "Map container has zero size after dialog opened", {
          hasApiKey: Boolean(apiKey),
        })
        return
      }

      reportMapDiagnostic("info", "Advanced location map container is mounted", {
        hasApiKey: Boolean(apiKey),
        apiKeyPrefix: apiKey ? `${apiKey.slice(0, 6)}...` : null,
      })
    }

    window.requestAnimationFrame(checkContainer)
    const timeout = window.setTimeout(checkContainer, 750)
    return () => window.clearTimeout(timeout)
  }, [apiKey, open])

  useEffect(() => {
    if (!open) return

    if (!apiKey) {
      reportMapDiagnostic("warn", "Google Maps initialization is waiting for a browser key", {
        hasContainerElement: Boolean(mapContainerElement),
      })
      return
    }

    if (!mapContainerElement) {
      reportMapDiagnostic("warn", "Google Maps initialization is waiting for the map container", {
        hasApiKey: Boolean(apiKey),
      })
      return
    }

    let cancelled = false
    let draw: TerraDraw | null = null
    let autocomplete: google.maps.places.Autocomplete | null = null
    let mapListeners: google.maps.MapsEventListener[] = []
    const previousAuthFailure = typeof window !== "undefined" ? (window as any).gm_authFailure : undefined

    if (typeof window !== "undefined") {
      const handleWindowError = (event: ErrorEvent) => {
        const message = event.message || event.error?.message
        if (!isGoogleMapsRuntimeMessage(message) && !isGoogleMapsRuntimeMessage(event.filename)) return
        reportMapDiagnostic("error", "Google Maps runtime error surfaced on window.error", {
          message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: serializeError(event.error),
        })
      }

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        const reason = serializeError(event.reason)
        const reasonText =
          typeof event.reason === "string"
            ? event.reason
            : event.reason instanceof Error
              ? event.reason.message
              : JSON.stringify(reason)
        if (!isGoogleMapsRuntimeMessage(reasonText)) return
        reportMapDiagnostic("error", "Google Maps runtime error surfaced on unhandledrejection", {
          reason,
        })
      }

      window.addEventListener("error", handleWindowError)
      window.addEventListener("unhandledrejection", handleUnhandledRejection)

      ;(window as any).gm_authFailure = () => {
        setMapStatus("failed")
        setMapsError(
          "Google Maps could not authenticate this browser key. Check API key restrictions, billing, and enabled Maps JavaScript/Places APIs."
        )
        reportMapDiagnostic("error", "Google Maps authentication failed via gm_authFailure", {
          hasApiKey: Boolean(apiKey),
          apiKeyPrefix: apiKey ? `${apiKey.slice(0, 6)}...` : null,
          origin: window.location.origin,
        })
        if (typeof previousAuthFailure === "function") previousAuthFailure()
      }

      mapListeners.push({
        remove: () => {
          window.removeEventListener("error", handleWindowError)
          window.removeEventListener("unhandledrejection", handleUnhandledRejection)
        },
      } as google.maps.MapsEventListener)
    }

    async function loadMap() {
      try {
        setMapsError(null)
        setTileWarning(null)
        setMapStatus("loading")
        reportMapDiagnostic("info", "Starting Google Maps initialization", {
          hasApiKey: Boolean(apiKey),
          apiKeyPrefix: apiKey ? `${apiKey.slice(0, 6)}...` : null,
          approximateQuery,
          latitude,
          longitude,
        })
        setOptions({
          key: apiKey,
          v: "weekly",
        })
        await Promise.all([
          importLibrary("maps"),
          importLibrary("places"),
          importLibrary("geometry"),
        ])
        if (cancelled || !mapContainerRef.current) return

        const maps = google.maps
        mapsRef.current = maps
        reportMapDiagnostic("info", "Google Maps libraries loaded", {
          libraries: ["maps", "places", "geometry"],
          version: maps.version,
        })

        const center =
          typeof latitude === "number" && typeof longitude === "number"
            ? { lat: latitude, lng: longitude }
            : DEFAULT_CENTER

        const map = new maps.Map(mapContainerRef.current, {
          center,
          zoom: latitude && longitude ? 17 : 12,
          mapTypeId: "satellite",
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: true,
        })
        mapRef.current = map
        placesServiceRef.current = new maps.places.PlacesService(map)
        reportMapDiagnostic("info", "Google Map instance created", {
          center,
          zoom: latitude && longitude ? 17 : 12,
          mapTypeId: "satellite",
          containerSize: {
            width: mapContainerRef.current.offsetWidth,
            height: mapContainerRef.current.offsetHeight,
          },
        })

        if (searchInputRef.current) {
          const nextAutocomplete = new maps.places.Autocomplete(searchInputRef.current, {
            componentRestrictions: { country: "ke" },
            fields: ["geometry", "name", "formatted_address"],
          })
          autocomplete = nextAutocomplete
          autocomplete.bindTo("bounds", map)
          mapListeners.push(nextAutocomplete.addListener("place_changed", () => {
            const place = nextAutocomplete.getPlace()
            const location = place?.geometry?.location
            if (!location) {
              reportMapDiagnostic("warn", "Autocomplete place_changed returned no geometry", {
                placeName: place?.name,
                formattedAddress: place?.formatted_address,
              })
              return
            }
            map.setCenter(location)
            map.setZoom(18)
            setSearchQuery(place.formatted_address || place.name || searchInputRef.current?.value || approximateQuery)
            setSearchError(null)
            setManualLat(location.lat().toFixed(6))
            setManualLng(location.lng().toFixed(6))
          }))
        }

        const loadTimeout = window.setTimeout(() => {
          if (!cancelled && mapRef.current === map) {
            setTileWarning(MAP_FAILURE_MESSAGE)
            reportMapDiagnostic("error", "Google Maps tilesloaded event did not fire before timeout", {
              timeoutMs: MAP_LOAD_TIMEOUT_MS,
              center: map.getCenter()?.toJSON(),
              zoom: map.getZoom(),
              mapTypeId: map.getMapTypeId(),
              hasPlacesService: Boolean(placesServiceRef.current),
              mapStatus: mapStatusRef.current,
            })
          }
        }, MAP_LOAD_TIMEOUT_MS)

        mapListeners.push(maps.event.addListenerOnce(map, "idle", () => {
          if (!cancelled && mapRef.current === map) {
            setMapStatus("ready")
            setMapsError(null)
            reportMapDiagnostic("info", "Google Map reached first idle; controls are enabled", {
              center: map.getCenter()?.toJSON(),
              zoom: map.getZoom(),
              mapTypeId: map.getMapTypeId(),
            })
          }
        }))

        mapListeners.push(maps.event.addListenerOnce(map, "tilesloaded", () => {
          window.clearTimeout(loadTimeout)
          if (!cancelled && mapRef.current === map) {
            setMapStatus("ready")
            setMapsError(null)
            setTileWarning(null)
            reportMapDiagnostic("info", "Google Maps tilesloaded fired", {
              center: map.getCenter()?.toJSON(),
              zoom: map.getZoom(),
              mapTypeId: map.getMapTypeId(),
            })
          }
        }))

        const refreshMapLayout = () => {
          if (cancelled || mapRef.current !== map) return
          maps.event.trigger(map, "resize")
          map.setCenter(center)
        }
        window.requestAnimationFrame(refreshMapLayout)
        window.setTimeout(refreshMapLayout, 250)

        draw = new TerraDraw({
          adapter: new TerraDrawGoogleMapsAdapter({
            lib: maps,
            map,
            isolatedData: true,
            coordinatePrecision: 7,
          }),
          modes: [
            new TerraDrawPolygonMode({
              modeName: "farm-boundary",
              editable: true,
              showCoordinatePoints: true,
              styles: {
                fillColor: "#16a34a",
                fillOpacity: 0.25,
                outlineColor: "#15803d",
                outlineWidth: 3,
                coordinatePointColor: "#ffffff",
                coordinatePointOutlineColor: "#15803d",
                coordinatePointWidth: 8,
                closingPointColor: "#f59e0b",
                closingPointOutlineColor: "#92400e",
                closingPointWidth: 10,
              },
            }),
          ],
          undoRedo: {
            modeLevel: new TerraDrawModeUndoRedo(),
            keyboardShortcuts: new TerraDrawUndoRedoKeyboardShortcuts(),
          },
        })
        draw.start()
        draw.setMode("static")
        draw.on("finish", () => {
          const nextPoints = draw ? getPolygonPoints(draw) : []
          const centroid = getBoundaryCentroid(nextPoints)
          setPoints(nextPoints)
          setManualBoundaryRows(boundaryPointsToRows(nextPoints))
          setManualBoundaryError(null)
          if (centroid) {
            setManualLat(formatCoordinate(centroid.lat))
            setManualLng(formatCoordinate(centroid.lng))
          }
          setDrawing(false)
          draw?.setMode("static")
        })
        drawRef.current = draw

        if (points.length > 2) {
          previewPolygonRef.current = new maps.Polygon({
            paths: points,
            strokeColor: "#15803d",
            strokeWeight: 3,
            fillColor: "#16a34a",
            fillOpacity: 0.2,
            map,
          })
        }
      } catch (error: any) {
        setMapStatus("failed")
        setMapsError(error?.message || "Could not load Google Maps.")
        reportMapDiagnostic("error", "Google Maps initialization threw", {
          error: serializeError(error),
          hasApiKey: Boolean(apiKey),
          apiKeyPrefix: apiKey ? `${apiKey.slice(0, 6)}...` : null,
        })
      }
    }

    void loadMap()

    return () => {
      cancelled = true
      if (typeof window !== "undefined") {
        ;(window as any).gm_authFailure = previousAuthFailure
      }
      mapListeners.forEach((listener) => listener.remove())
      previewPolygonRef.current?.setMap(null)
      previewPolygonRef.current = null
      draw?.stop()
      drawRef.current = null
      mapRef.current = null
      mapsRef.current = null
      placesServiceRef.current = null
      setMapStatus("idle")
      setDrawing(false)
      setSearchLoading(false)
      setTileWarning(null)
    }
  }, [apiKey, approximateQuery, latitude, longitude, mapContainerElement, open])

  useEffect(() => {
    if (!open || !apiKey || mapStatus === "failed") return

    const inspectMapDom = () => {
      const dom = getMapDomSnapshot(mapContainerRef.current)

      if (!dom.hasContainer || dom.width === 0 || dom.height === 0) {
        setMapStatus("failed")
        setMapsError("Google Maps cannot render because the map container is missing or has zero size.")
        reportMapDiagnostic("error", "Google Maps render container is invalid", {
          hasApiKey: Boolean(apiKey),
        })
        return
      }

      if (mapStatusRef.current === "ready" && !dom.hasGoogleMapShell) {
        setMapStatus("failed")
        setMapsError("Google Maps reported ready but did not attach its map DOM.")
        reportMapDiagnostic("error", "Google Maps reported ready but .gm-style is missing", {
          hasApiKey: Boolean(apiKey),
        })
        return
      }

      if (mapStatusRef.current === "ready" && dom.hasGoogleMapShell && dom.tileImageCount === 0) {
        setTileWarning(MAP_FAILURE_MESSAGE)
        reportMapDiagnostic("warn", "Google Maps shell is present but no tile images were detected", {
          hasApiKey: Boolean(apiKey),
        })
      }
    }

    const firstTimeout = window.setTimeout(inspectMapDom, 2500)
    const secondTimeout = window.setTimeout(inspectMapDom, 7000)
    return () => {
      window.clearTimeout(firstTimeout)
      window.clearTimeout(secondTimeout)
    }
  }, [apiKey, mapStatus, open])

  useEffect(() => {
    if (!mapsRef.current || !mapRef.current) return
    previewPolygonRef.current?.setMap(null)
    previewPolygonRef.current = null
    if (points.length > 2 && !drawing) {
      previewPolygonRef.current = new mapsRef.current.Polygon({
        paths: points,
        strokeColor: "#15803d",
        strokeWeight: 3,
        fillColor: "#16a34a",
        fillOpacity: 0.2,
        map: mapRef.current,
      })
    }
  }, [drawing, points])

  useEffect(() => {
    if (!open || !mapsReady || !mapsRef.current || !mapRef.current) return
    const lat = Number(manualLat)
    const lng = Number(manualLng)
    const center = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : DEFAULT_CENTER
    const refresh = () => {
      if (!mapsRef.current || !mapRef.current) return
      mapsRef.current.event.trigger(mapRef.current, "resize")
      mapRef.current.setCenter(center)
    }
    window.requestAnimationFrame(refresh)
    const timeout = window.setTimeout(refresh, 300)
    return () => window.clearTimeout(timeout)
  }, [manualLat, manualLng, mapsReady, open])

  const areaAcres = useMemo(() => {
    if (!mapsRef.current || points.length < 3) return null
    const path = points.map((point) => new mapsRef.current!.LatLng(point.lat, point.lng))
    return mapsRef.current.geometry.spherical.computeArea(path) / SQM_PER_ACRE
  }, [points])

  const applyPlaceLocation = (place: google.maps.places.PlaceResult) => {
    const location = place.geometry?.location
    if (!location || !mapRef.current) return false

    mapRef.current.setCenter(location)
    mapRef.current.setZoom(18)
    setManualLat(formatCoordinate(location.lat()))
    setManualLng(formatCoordinate(location.lng()))
    setSearchQuery(place.formatted_address || place.name || searchQuery)
    setSearchError(null)
    return true
  }

  const handleSearch = () => {
    const service = placesServiceRef.current
    const query = searchQuery.trim()

    if (!query) {
      setSearchError("Enter a nearby town, village, road, or farm area first.")
      return
    }

    if (!service || !mapRef.current || !mapsRef.current || mapStatus !== "ready") {
      reportMapDiagnostic("warn", "Search attempted before Google Maps controls were ready", {
        hasPlacesService: Boolean(service),
        hasMap: Boolean(mapRef.current),
        hasMapsLibrary: Boolean(mapsRef.current),
        mapStatus,
      })
      setSearchError("The map is still loading. Try again once it is ready.")
      return
    }

    setSearchLoading(true)
    setSearchError(null)
    reportMapDiagnostic("info", "Running Places findPlaceFromQuery", {
      query,
      mapStatus,
      bounds: mapRef.current.getBounds()?.toJSON(),
    })

    service.findPlaceFromQuery(
      {
        query,
        fields: ["geometry", "name", "formatted_address"],
        locationBias: mapRef.current.getBounds() || undefined,
      },
      (results, status) => {
        setSearchLoading(false)

        if (status !== mapsRef.current?.places.PlacesServiceStatus.OK || !results?.[0]) {
          reportMapDiagnostic("warn", "Places findPlaceFromQuery returned no usable result", {
            query,
            status,
            resultCount: results?.length || 0,
          })
          setSearchError("No matching location was found. Try a nearby town, road, or trading centre.")
          return
        }

        reportMapDiagnostic("info", "Places search selected a result", {
          query,
          name: results[0].name,
          formattedAddress: results[0].formatted_address,
          location: results[0].geometry?.location?.toJSON(),
        })
        applyPlaceLocation(results[0])
      }
    )
  }

  const handleDraw = () => {
    if (!mapsReady || !hasValidCoordinates) {
      reportMapDiagnostic("warn", "Draw attempted before prerequisites were satisfied", {
        mapsReady,
        hasValidCoordinates,
        mapStatus,
        manualLat,
        manualLng,
      })
      setSearchError("Search or enter valid coordinates before drawing the farm boundary.")
      return
    }
    previewPolygonRef.current?.setMap(null)
    drawRef.current?.clear()
    drawRef.current?.setMode("farm-boundary")
    setPoints([])
    setManualBoundaryRows(createEmptyBoundaryRows())
    setManualBoundaryError(null)
    setDrawing(true)
    reportMapDiagnostic("info", "Farm boundary drawing started", {
      manualLat,
      manualLng,
    })
  }

  const handleUndo = () => {
    drawRef.current?.undo()
    const nextPoints = drawRef.current ? getPolygonPoints(drawRef.current) : []
    setPoints(nextPoints)
    setManualBoundaryRows(boundaryPointsToRows(nextPoints))
    setManualBoundaryError(null)
  }

  const handleClear = () => {
    drawRef.current?.clear()
    drawRef.current?.setMode("static")
    setDrawing(false)
    setPoints([])
    setManualBoundaryRows(createEmptyBoundaryRows())
    setManualBoundaryError(null)
  }

  const applyBoundaryRows = (rows: BoundaryRow[]) => {
    const result = parseBoundaryRows(rows)
    setManualBoundaryError(result.error)
    if (!result.error) {
      setPoints(result.points)
      const centroid = getBoundaryCentroid(result.points)
      if (centroid) {
        setManualLat(formatCoordinate(centroid.lat))
        setManualLng(formatCoordinate(centroid.lng))
      }
    }
    return result
  }

  const handleBoundaryRowChange = (index: number, field: keyof BoundaryRow, value: string) => {
    const nextRows = manualBoundaryRows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [field]: value } : row
    )
    setManualBoundaryRows(nextRows)
    applyBoundaryRows(nextRows)
  }

  const handleAddBoundaryRow = () => {
    setManualBoundaryRows((rows) => [...rows, { lat: "", lng: "" }])
  }

  const handleRemoveBoundaryRow = (index: number) => {
    const nextRows = manualBoundaryRows.filter((_, rowIndex) => rowIndex !== index)
    const paddedRows = nextRows.length > 0 ? nextRows : createEmptyBoundaryRows()
    setManualBoundaryRows(paddedRows)
    applyBoundaryRows(paddedRows)
  }

  const handleSave = () => {
    const boundaryResult = applyBoundaryRows(manualBoundaryRows)
    if (boundaryResult.error) {
      return
    }
    const nextPoints = boundaryResult.points.length >= 3 ? boundaryResult.points : []

    onSave({
      latitude: manualLat.trim() ? Number.parseFloat(manualLat) : null,
      longitude: manualLng.trim() ? Number.parseFloat(manualLng) : null,
      boundary: nextPoints,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-agri-800">
            <MapPin className="h-5 w-5 text-agri-600" />
            Advanced Location Entry
          </DialogTitle>
          <DialogDescription className="sr-only">
            Search for a farm location, draw a boundary on the map, or enter coordinates manually.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-3">
            <div className="rounded-xl border border-agri-100 bg-agri-50 p-3 text-sm text-agri-800">
              Search near the farm, zoom in, then tap points around the boundary.
              Tap the first point again or press Enter to finish.
            </div>

            {apiKey ? (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value)
                      setSearchError(null)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        handleSearch()
                      }
                    }}
                    placeholder="Search farm area, trading centre, or village"
                    className="h-11 pl-9 pr-24"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSearch}
                    disabled={mapStatus !== "ready" || searchLoading}
                    className="absolute right-1.5 top-1 h-9 px-3"
                  >
                    {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                  </Button>
                </div>
                <div className="relative h-[360px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <div ref={setMapContainer} className="h-full w-full" />
                  <div className="pointer-events-none absolute left-2 top-2 z-10 max-w-[calc(100%-1rem)] rounded bg-white/95 px-2 py-1 text-[10px] font-medium text-slate-700 shadow">
                    {MAP_DIAGNOSTIC_MARKER} | {mapStatus} | {mapDiagnosticText}
                  </div>
                  {mapStatus === "loading" ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-100/85">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-agri-800 shadow">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading map...
                      </div>
                    </div>
                  ) : null}
                  {mapStatus === "failed" ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 p-5 text-center">
                      <div className="max-w-sm text-sm text-slate-700">
                        <AlertCircle className="mx-auto mb-2 h-6 w-6 text-amber-600" />
                        <div className="font-semibold text-slate-950">Map could not render</div>
                        <div className="mt-1">
                          Check the key referrer, billing, quota, and enabled Maps JavaScript and Places APIs.
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
                {searchError ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <div className="flex gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{searchError}</span>
                    </div>
                  </div>
                ) : null}
                {mapsError ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <div className="flex gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{mapsError}. You can still enter the farm boundary manually.</span>
                    </div>
                  </div>
                ) : null}
                {tileWarning ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <div className="flex gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{tileWarning}. Search may still work because the Places service loaded.</span>
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={handleDraw}
                    disabled={!mapsReady || !hasValidCoordinates}
                    className="bg-agri-700 hover:bg-agri-800"
                  >
                    Draw farm boundary
                  </Button>
                  <Button type="button" variant="outline" onClick={handleUndo} disabled={!drawing}>
                    <Undo2 className="mr-2 h-4 w-4" />
                    Undo
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClear}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
                {!hasValidCoordinates ? (
                  <p className="text-xs font-medium text-slate-500">
                    Search and select an approximate farm location before drawing the boundary.
                  </p>
                ) : null}
              </>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Location service is not available. Manual coordinate entry is available below.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <Label htmlFor="advanced-lat">Latitude</Label>
                <Input
                  id="advanced-lat"
                  type="number"
                  step="0.000001"
                  min="-90"
                  max="90"
                  value={manualLat}
                  onChange={(event) => setManualLat(event.target.value)}
                  placeholder="-0.303100"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="advanced-lng">Longitude</Label>
                <Input
                  id="advanced-lng"
                  type="number"
                  step="0.000001"
                  min="-180"
                  max="180"
                  value={manualLng}
                  onChange={(event) => setManualLng(event.target.value)}
                  placeholder="36.080000"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-950">Boundary preview</div>
              <div className="mt-2 text-sm text-slate-600">
                {points.length >= 3
                  ? `${points.length} boundary points captured`
                  : "No boundary saved yet"}
              </div>
              {formatArea(areaAcres) ? (
                <div className="mt-2 rounded-lg bg-agri-50 px-3 py-2 text-sm font-semibold text-agri-800">
                  Approximate area: {formatArea(areaAcres)}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Manual farm boundary points</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddBoundaryRow}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add point
                </Button>
              </div>
              <div className="space-y-2">
                {manualBoundaryRows.map((row, index) => (
                  <div key={`boundary-row-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Input
                      type="number"
                      step="0.000001"
                      min="-90"
                      max="90"
                      value={row.lat}
                      onChange={(event) => handleBoundaryRowChange(index, "lat", event.target.value)}
                      placeholder={index === 0 ? "-0.303100" : "Latitude"}
                      aria-label={`Boundary point ${index + 1} latitude`}
                    />
                    <Input
                      type="number"
                      step="0.000001"
                      min="-180"
                      max="180"
                      value={row.lng}
                      onChange={(event) => handleBoundaryRowChange(index, "lng", event.target.value)}
                      placeholder={index === 0 ? "36.080000" : "Longitude"}
                      aria-label={`Boundary point ${index + 1} longitude`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveBoundaryRow(index)}
                      aria-label={`Remove boundary point ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {manualBoundaryError ? (
                <p className="text-xs font-medium text-red-700">{manualBoundaryError}</p>
              ) : (
                <p className="text-xs text-slate-500">
                  Enter the corner points around your farm boundary in order. Four rows are provided for a typical rectangular plot; add or remove points as needed.
                </p>
              )}
            </div>

            <Button type="button" onClick={handleSave} className="w-full bg-agri-700 hover:bg-agri-800">
              <Save className="mr-2 h-4 w-4" />
              Save location details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
