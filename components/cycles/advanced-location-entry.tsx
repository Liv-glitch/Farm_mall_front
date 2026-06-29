"use client"

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { importLibrary, setOptions } from "@googlemaps/js-api-loader"
import {
  TerraDraw,
  TerraDrawModeUndoRedo,
  TerraDrawPolygonMode,
  TerraDrawUndoRedoKeyboardShortcuts,
} from "terra-draw"
import { TerraDrawGoogleMapsAdapter } from "terra-draw-google-maps-adapter"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Keyboard,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type BoundaryPoint = { lat: number; lng: number }
type BoundaryRow = { lat: string; lng: string }
type MapStatus = "idle" | "loading" | "ready" | "failed"
type View = "map" | "manual"
type Step = "search" | "adjust" | "drawing" | "confirm"

type Prediction = {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
}

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

// Default to Nairobi as a well-known Kenyan starting point.
const NAIROBI_CENTER = { lat: -1.286389, lng: 36.817223 }
const DEFAULT_ZOOM = 11
const FOCUSED_ZOOM = 17
const SATELLITE_MAP_TYPE = "hybrid"
const ROADMAP_MAP_TYPE = "roadmap"
const SQM_PER_ACRE = 4046.8564224
const MIN_BOUNDARY_POINTS = 3
const EMPTY_BOUNDARY_ROW_COUNT = 4
// The Terra Draw Google Maps adapter looks up the map container by id when wiring
// its OverlayView. Without this id the draw layer never attaches and clicks
// never produce vertices.
const MAP_CONTAINER_ID = "advanced-location-map-container"
const AUTOCOMPLETE_DEBOUNCE_MS = 220

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
      point.lng > 180,
  )

  if (invalidPoint) {
    return { points: [], error: "Boundary coordinates must use valid latitude and longitude values." }
  }

  if (points.length > 0 && points.length < MIN_BOUNDARY_POINTS) {
    return { points, error: `A farm boundary needs at least ${MIN_BOUNDARY_POINTS} points.` }
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
    { lat: 0, lng: 0 },
  )

  return {
    lat: total.lat / points.length,
    lng: total.lng / points.length,
  }
}

function getPolygonPoints(draw: TerraDraw): BoundaryPoint[] {
  const polygon = draw.getSnapshot().find((feature) => feature.geometry.type === "Polygon")
  if (!polygon || polygon.geometry.type !== "Polygon") return []

  const ring = (polygon.geometry.coordinates[0] || []) as number[][]
  return ring
    .map(([lng, lat]: number[]) => ({ lat, lng }))
    .filter((point: BoundaryPoint, index: number, all: BoundaryPoint[]) => {
      if (index !== all.length - 1) return true
      const first = all[0]
      return !(first && first.lat === point.lat && first.lng === point.lng)
    })
}

function formatArea(areaAcres: number | null) {
  if (!areaAcres || areaAcres <= 0) return null
  if (areaAcres < 1) return `${areaAcres.toFixed(2)} acres`
  return `${areaAcres.toFixed(1)} acres`
}

function normalizeApiKey(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || ""
}

function determineInitialStep(
  boundary: BoundaryPoint[],
  latitude: number | null,
  longitude: number | null,
): Step {
  if (boundary.length >= MIN_BOUNDARY_POINTS) return "confirm"
  if (latitude !== null && longitude !== null) return "adjust"
  return "search"
}

const STEP_HINTS: Record<Step, string> = {
  search: "Search for your location and pick it from the suggestions below.",
  adjust: "Pan and zoom until you can see your farm clearly, then start drawing the boundary.",
  drawing: "Tap each corner of your farm. Press Enter (or tap the first point again) to finish.",
  confirm: "Review your farm boundary. Approve to save, or start over to redraw it.",
}

const STEP_LABELS: { key: Step; label: string }[] = [
  { key: "search", label: "Search" },
  { key: "adjust", label: "Adjust" },
  { key: "drawing", label: "Draw" },
  { key: "confirm", label: "Confirm" },
]

export function AdvancedLocationEntry({
  open,
  onOpenChange,
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
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const predictionTimerRef = useRef<number | null>(null)
  const stepRef = useRef<Step>("search")
  // Capture latest props so the map init effect can read them without re-running.
  const initPropsRef = useRef({ latitude, longitude, boundary })

  const [mapContainerElement, setMapContainerElement] = useState<HTMLDivElement | null>(null)
  const [mapStatus, setMapStatus] = useState<MapStatus>("idle")
  const [mapsError, setMapsError] = useState<string | null>(null)
  const [drawReady, setDrawReady] = useState(false)
  const [view, setView] = useState<View>("map")
  const [step, setStep] = useState<Step>("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [predictionsLoading, setPredictionsLoading] = useState(false)
  const [predictionsOpen, setPredictionsOpen] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [points, setPoints] = useState<BoundaryPoint[]>(boundary)
  const [manualLat, setManualLat] = useState<string>(latitude?.toString() ?? "")
  const [manualLng, setManualLng] = useState<string>(longitude?.toString() ?? "")
  const [manualBoundaryRows, setManualBoundaryRows] = useState<BoundaryRow[]>(
    boundaryPointsToRows(boundary),
  )
  const [manualBoundaryError, setManualBoundaryError] = useState<string | null>(null)

  const apiKey = normalizeApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
  const mapsReady = mapStatus === "ready"
  const canDraw = mapsReady && drawReady
  const hasMinBoundary = points.length >= MIN_BOUNDARY_POINTS

  const setMapContainer = useCallback((node: HTMLDivElement | null) => {
    mapContainerRef.current = node
    setMapContainerElement(node)
  }, [])

  // Keep refs in sync without retriggering the map init effect.
  useEffect(() => {
    initPropsRef.current = { latitude, longitude, boundary }
  })

  useEffect(() => {
    stepRef.current = step
  }, [step])

  // Reset dialog state every time it opens. Depending only on `open` avoids
  // wiping a user's in-progress changes when unrelated parent state shifts.
  useEffect(() => {
    if (!open) return
    const props = initPropsRef.current
    setView("map")
    setStep(determineInitialStep(props.boundary, props.latitude, props.longitude))
    setPoints(props.boundary)
    setManualLat(props.latitude?.toString() ?? "")
    setManualLng(props.longitude?.toString() ?? "")
    setManualBoundaryRows(boundaryPointsToRows(props.boundary))
    setManualBoundaryError(null)
    setSearchQuery("")
    setSearchError(null)
    setPredictions([])
    setPredictionsOpen(false)
    setMapsError(null)
  }, [open])

  // Main Google Maps + Terra Draw initialization. Runs once per dialog open
  // when both the API key and the map container element are available.
  useEffect(() => {
    if (!open || !apiKey || !mapContainerElement) return

    let cancelled = false
    let draw: TerraDraw | null = null
    const cleanupFns: Array<() => void> = []
    const previousAuthFailure =
      typeof window !== "undefined" ? (window as any).gm_authFailure : undefined

    if (typeof window !== "undefined") {
      ;(window as any).gm_authFailure = () => {
        setMapStatus("failed")
        setMapsError(
          "Google Maps could not authenticate this browser key. You can still enter coordinates manually.",
        )
        if (typeof previousAuthFailure === "function") previousAuthFailure()
      }
    }

    async function loadMap() {
      try {
        setMapStatus("loading")
        setMapsError(null)
        setDrawReady(false)
        setOptions({ key: apiKey, v: "weekly" })
        await Promise.all([
          importLibrary("maps"),
          importLibrary("places"),
          importLibrary("geometry"),
        ])
        if (cancelled || !mapContainerRef.current) return

        const maps = google.maps
        mapsRef.current = maps

        const props = initPropsRef.current
        const hasSavedCoordinates =
          typeof props.latitude === "number" && typeof props.longitude === "number"
        const initialCenter = hasSavedCoordinates
          ? { lat: props.latitude as number, lng: props.longitude as number }
          : NAIROBI_CENTER
        const initialZoom = hasSavedCoordinates ? FOCUSED_ZOOM : DEFAULT_ZOOM
        const initialMapType = hasSavedCoordinates ? SATELLITE_MAP_TYPE : ROADMAP_MAP_TYPE

        const map = new maps.Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          mapTypeId: initialMapType,
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: true,
          clickableIcons: false,
          draggableCursor: "grab",
          draggingCursor: "grabbing",
        })
        mapRef.current = map
        placesServiceRef.current = new maps.places.PlacesService(map)
        autocompleteServiceRef.current = new maps.places.AutocompleteService()
        sessionTokenRef.current = new maps.places.AutocompleteSessionToken()

        const idleListener = maps.event.addListenerOnce(map, "idle", () => {
          if (cancelled || mapRef.current !== map) return
          setMapStatus("ready")
        })
        cleanupFns.push(() => idleListener.remove())

        const tilesListener = maps.event.addListenerOnce(map, "tilesloaded", () => {
          if (cancelled || mapRef.current !== map) return
          setMapStatus("ready")
        })
        cleanupFns.push(() => tilesListener.remove())

        // Force a layout refresh in case Radix's dialog finished animating
        // after the map mounted (zero-size container race).
        const refreshMapLayout = () => {
          if (cancelled || mapRef.current !== map) return
          maps.event.trigger(map, "resize")
          map.setCenter(initialCenter)
        }
        window.requestAnimationFrame(refreshMapLayout)
        const layoutTimeout = window.setTimeout(refreshMapLayout, 300)
        cleanupFns.push(() => window.clearTimeout(layoutTimeout))

        // Terra Draw + Google Maps adapter. Two hard requirements per the
        // upstream docs that fix the "nothing renders when I click" bug:
        //   1. The map container element MUST have an `id` set on the DOM
        //      node. (Set on the rendered <div> further below.)
        //   2. We MUST wait for the draw `ready` event before calling
        //      `setMode`, because the adapter wires its OverlayView
        //      asynchronously. Calling setMode earlier silently fails: the
        //      cursor changes via map.setOptions but no click reaches Terra
        //      Draw, so no vertices or lines ever render.
        draw = new TerraDraw({
          adapter: new TerraDrawGoogleMapsAdapter({
            lib: maps,
            map,
            coordinatePrecision: 7,
          }),
          modes: [
            // Keep the built-in `polygon` mode name. Using a custom modeName
            // here previously caused style-lookup mismatches on closing
            // points (upstream issue #749 on terra-draw).
            new TerraDrawPolygonMode({
              editable: false,
              showCoordinatePoints: true,
              cursors: {
                start: "crosshair",
                close: "pointer",
                dragStart: "grabbing",
                dragEnd: "crosshair",
              },
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

        draw.on("ready", () => {
          if (cancelled || drawRef.current !== draw) return
          setDrawReady(true)
        })

        draw.on("change", () => {
          if (!draw) return
          const next = getPolygonPoints(draw)
          setPoints(next)
        })

        draw.on("finish", () => {
          if (!draw || !mapRef.current) return
          const next = getPolygonPoints(draw)
          if (next.length < MIN_BOUNDARY_POINTS) return
          setPoints(next)
          try {
            draw.setMode("static")
          } catch (error) {
            console.warn("[AdvancedLocationEntry] Could not switch to static mode:", error)
          }
          mapRef.current.setOptions({
            draggable: true,
            draggableCursor: "grab",
            draggingCursor: "grabbing",
          })
          setStep("confirm")
        })

        draw.start()
        drawRef.current = draw
      } catch (error: any) {
        if (cancelled) return
        setMapStatus("failed")
        setMapsError(
          error?.message || "Could not load Google Maps. You can still enter coordinates manually.",
        )
        console.error("[AdvancedLocationEntry] Google Maps initialization failed:", error)
      }
    }

    void loadMap()

    return () => {
      cancelled = true
      if (typeof window !== "undefined") {
        ;(window as any).gm_authFailure = previousAuthFailure
      }
      cleanupFns.forEach((fn) => fn())
      previewPolygonRef.current?.setMap(null)
      previewPolygonRef.current = null
      try {
        draw?.clear()
      } catch {
        /* ignore */
      }
      try {
        draw?.stop()
      } catch {
        /* ignore */
      }
      drawRef.current = null
      mapRef.current = null
      mapsRef.current = null
      placesServiceRef.current = null
      autocompleteServiceRef.current = null
      sessionTokenRef.current = null
      if (predictionTimerRef.current !== null) {
        window.clearTimeout(predictionTimerRef.current)
        predictionTimerRef.current = null
      }
      setMapStatus("idle")
      setDrawReady(false)
    }
  }, [apiKey, mapContainerElement, open])

  // Sync the preview polygon overlay so saved/loaded boundaries are visible
  // when Terra Draw itself isn't rendering them (e.g. when the dialog opens
  // with an existing boundary or we leave the drawing step).
  useEffect(() => {
    if (!mapsRef.current || !mapRef.current) return

    const drawHasPolygon = drawRef.current
      ? drawRef.current.getSnapshot().some((feature) => feature.geometry.type === "Polygon")
      : false

    previewPolygonRef.current?.setMap(null)
    previewPolygonRef.current = null

    if (drawHasPolygon || step === "drawing" || points.length < MIN_BOUNDARY_POINTS) {
      return
    }

    previewPolygonRef.current = new mapsRef.current.Polygon({
      paths: points,
      strokeColor: "#15803d",
      strokeWeight: 3,
      fillColor: "#16a34a",
      fillOpacity: 0.2,
      map: mapRef.current,
    })
  }, [points, step, drawReady, mapStatus])

  // Area in acres, computed from the geometry library once it has loaded.
  const areaAcres = useMemo(() => {
    const maps = mapsRef.current
    if (!maps || points.length < MIN_BOUNDARY_POINTS) return null
    try {
      const path = points.map((point) => new maps.LatLng(point.lat, point.lng))
      return maps.geometry.spherical.computeArea(path) / SQM_PER_ACRE
    } catch {
      return null
    }
    // mapStatus is included so the calculation re-runs once geometry is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, mapStatus])

  // -----------------------------------------------------------------------
  // Custom in-dialog autocomplete (replaces legacy `places.Autocomplete`).
  // The legacy widget renders its `.pac-container` into document.body, which
  // sits outside the Radix Dialog and is unreliable to tap, especially on
  // mobile (z-index / focus-trap / blur-vs-tap races). Hosting the dropdown
  // inside the dialog gives us reliable touch + click selection.
  // -----------------------------------------------------------------------
  const requestPredictions = useCallback((input: string) => {
    const service = autocompleteServiceRef.current
    const maps = mapsRef.current
    if (!service || !maps) {
      setPredictions([])
      setPredictionsOpen(false)
      return
    }

    setPredictionsLoading(true)
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new maps.places.AutocompleteSessionToken()
    }

    service.getPlacePredictions(
      {
        input,
        sessionToken: sessionTokenRef.current,
        componentRestrictions: { country: "ke" },
      },
      (results, status) => {
        setPredictionsLoading(false)
        if (!results || status !== maps.places.PlacesServiceStatus.OK) {
          setPredictions([])
          setPredictionsOpen(input.trim().length > 0)
          return
        }
        setPredictions(
          results.map((result) => ({
            placeId: result.place_id,
            description: result.description,
            mainText: result.structured_formatting?.main_text || result.description,
            secondaryText: result.structured_formatting?.secondary_text || "",
          })),
        )
        setPredictionsOpen(true)
      },
    )
  }, [])

  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    setSearchError(null)

    if (predictionTimerRef.current !== null) {
      window.clearTimeout(predictionTimerRef.current)
      predictionTimerRef.current = null
    }

    const trimmed = value.trim()
    if (!trimmed) {
      setPredictions([])
      setPredictionsOpen(false)
      return
    }

    predictionTimerRef.current = window.setTimeout(() => {
      requestPredictions(trimmed)
    }, AUTOCOMPLETE_DEBOUNCE_MS)
  }

  const handlePredictionSelect = (prediction: Prediction) => {
    const service = placesServiceRef.current
    const map = mapRef.current
    const maps = mapsRef.current
    if (!service || !map || !maps) return

    setPredictionsOpen(false)
    setPredictions([])
    setSearchQuery(prediction.description)

    const sessionToken = sessionTokenRef.current ?? undefined

    service.getDetails(
      {
        placeId: prediction.placeId,
        fields: ["geometry", "name", "formatted_address"],
        sessionToken,
      },
      (place, status) => {
        // Each getDetails call ends the autocomplete session; mint a fresh token.
        sessionTokenRef.current = new maps.places.AutocompleteSessionToken()

        if (status !== maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) {
          setSearchError("Could not load that place. Try another suggestion.")
          return
        }

        const location = place.geometry.location
        map.setCenter(location)
        map.setZoom(FOCUSED_ZOOM)
        map.setMapTypeId(SATELLITE_MAP_TYPE)
        setManualLat(formatCoordinate(location.lat()))
        setManualLng(formatCoordinate(location.lng()))
        if (stepRef.current === "search") {
          setStep("adjust")
        }
      },
    )
  }

  const handleStartDrawing = () => {
    if (!canDraw) {
      setSearchError("The map is still loading. Try again in a moment.")
      return
    }
    previewPolygonRef.current?.setMap(null)
    previewPolygonRef.current = null
    try {
      drawRef.current?.clear()
    } catch {
      /* ignore */
    }
    setPoints([])
    setManualBoundaryRows(createEmptyBoundaryRows())
    setManualBoundaryError(null)
    try {
      drawRef.current?.setMode("polygon")
    } catch (error) {
      console.error("[AdvancedLocationEntry] Could not enter polygon mode:", error)
      setSearchError("Drawing tools aren't ready yet. Wait for the map to finish loading.")
      return
    }
    mapRef.current?.setOptions({
      draggable: false,
      draggableCursor: "crosshair",
      draggingCursor: "crosshair",
    })
    setStep("drawing")
  }

  const handleCancelDrawing = () => {
    try {
      drawRef.current?.clear()
      drawRef.current?.setMode("static")
    } catch {
      /* ignore */
    }
    mapRef.current?.setOptions({
      draggable: true,
      draggableCursor: "grab",
      draggingCursor: "grabbing",
    })
    setPoints([])
    setManualBoundaryRows(createEmptyBoundaryRows())
    setStep(initPropsRef.current.latitude !== null ? "adjust" : "search")
  }

  const handleUndo = () => {
    try {
      drawRef.current?.undo()
    } catch {
      /* ignore */
    }
    const next = drawRef.current ? getPolygonPoints(drawRef.current) : []
    setPoints(next)
  }

  const handleStartOver = () => {
    handleStartDrawing()
  }

  const handleApprove = () => {
    if (!hasMinBoundary) return
    const centroid = getBoundaryCentroid(points)
    onSave({
      latitude: centroid?.lat ?? null,
      longitude: centroid?.lng ?? null,
      boundary: points,
    })
    onOpenChange(false)
  }

  const handleManualBoundaryRowChange = (
    index: number,
    field: keyof BoundaryRow,
    value: string,
  ) => {
    const next = manualBoundaryRows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [field]: value } : row,
    )
    setManualBoundaryRows(next)
    setManualBoundaryError(null)
  }

  const handleAddManualBoundaryRow = () => {
    setManualBoundaryRows((rows) => [...rows, { lat: "", lng: "" }])
  }

  const handleRemoveManualBoundaryRow = (index: number) => {
    const next = manualBoundaryRows.filter((_, rowIndex) => rowIndex !== index)
    setManualBoundaryRows(next.length > 0 ? next : createEmptyBoundaryRows())
    setManualBoundaryError(null)
  }

  const handleManualSave = () => {
    const latTrimmed = manualLat.trim()
    const lngTrimmed = manualLng.trim()

    let nextLat: number | null = null
    let nextLng: number | null = null

    if (latTrimmed) {
      const value = Number.parseFloat(latTrimmed)
      if (!Number.isFinite(value) || value < -90 || value > 90) {
        setManualBoundaryError("Latitude must be a number between -90 and 90.")
        return
      }
      nextLat = value
    }

    if (lngTrimmed) {
      const value = Number.parseFloat(lngTrimmed)
      if (!Number.isFinite(value) || value < -180 || value > 180) {
        setManualBoundaryError("Longitude must be a number between -180 and 180.")
        return
      }
      nextLng = value
    }

    const boundaryResult = parseBoundaryRows(manualBoundaryRows)
    if (boundaryResult.error) {
      setManualBoundaryError(boundaryResult.error)
      return
    }

    const nextBoundary =
      boundaryResult.points.length >= MIN_BOUNDARY_POINTS ? boundaryResult.points : []

    if (nextLat === null || nextLng === null) {
      if (nextBoundary.length >= MIN_BOUNDARY_POINTS) {
        const centroid = getBoundaryCentroid(nextBoundary)
        if (centroid) {
          nextLat = centroid.lat
          nextLng = centroid.lng
        }
      }
    }

    onSave({
      latitude: nextLat,
      longitude: nextLng,
      boundary: nextBoundary,
    })
    onOpenChange(false)
  }

  const currentStepIndex = STEP_LABELS.findIndex((s) => s.key === step)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[92vh] overflow-y-auto",
          view === "manual" ? "max-w-2xl" : "max-w-5xl",
        )}
      >
        <DialogHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <DialogTitle className="flex items-center gap-2 text-agri-800">
                <MapPin className="h-5 w-5 text-agri-600" />
                {view === "manual" ? "Enter Coordinates Manually" : "Advanced Location Entry"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                {view === "manual"
                  ? "Type your farm's exact latitude and longitude, and optionally the corner points of its boundary."
                  : "Find your farm on the map and trace its boundary, or switch to manual entry."}
              </DialogDescription>
            </div>
            {view === "map" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setView("manual")}
                className="text-agri-700 underline-offset-4 hover:bg-transparent hover:text-agri-900 hover:underline"
              >
                <Keyboard className="mr-1.5 h-4 w-4" />
                Enter coordinates manually instead
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setView("map")}
                className="text-agri-700 hover:bg-agri-50 hover:text-agri-900"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to map
              </Button>
            )}
          </div>
        </DialogHeader>

        {view === "manual" ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-agri-100 bg-agri-50 p-3 text-sm text-agri-800">
              Use this form only if you already know your farm&apos;s exact coordinates or you
              can&apos;t use the map. Otherwise, switch back to the map view to draw your boundary.
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="manual-lat">Latitude</Label>
                <Input
                  id="manual-lat"
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
                <Label htmlFor="manual-lng">Longitude</Label>
                <Input
                  id="manual-lng"
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

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Farm boundary points (optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddManualBoundaryRow}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add point
                </Button>
              </div>
              <div className="space-y-2">
                {manualBoundaryRows.map((row, index) => (
                  <div key={`manual-boundary-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Input
                      type="number"
                      step="0.000001"
                      min="-90"
                      max="90"
                      value={row.lat}
                      onChange={(event) =>
                        handleManualBoundaryRowChange(index, "lat", event.target.value)
                      }
                      placeholder={index === 0 ? "-0.303100" : "Latitude"}
                      aria-label={`Boundary point ${index + 1} latitude`}
                    />
                    <Input
                      type="number"
                      step="0.000001"
                      min="-180"
                      max="180"
                      value={row.lng}
                      onChange={(event) =>
                        handleManualBoundaryRowChange(index, "lng", event.target.value)
                      }
                      placeholder={index === 0 ? "36.080000" : "Longitude"}
                      aria-label={`Boundary point ${index + 1} longitude`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveManualBoundaryRow(index)}
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
                  Enter at least {MIN_BOUNDARY_POINTS} corner points if you want to save a
                  boundary, or leave them blank to save just the coordinates.
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleManualSave}
                className="bg-agri-700 hover:bg-agri-800"
              >
                <Save className="mr-2 h-4 w-4" />
                Save coordinates
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <StepIndicator currentIndex={currentStepIndex} />

            <div className="rounded-xl border border-agri-100 bg-agri-50 p-3 text-sm text-agri-800">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-agri-600" />
                <span>{STEP_HINTS[step]}</span>
              </div>
            </div>

            {apiKey ? (
              <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
                <div className="space-y-3">
                  {/* Search input + custom in-dialog autocomplete dropdown */}
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(event) => handleSearchInput(event.target.value)}
                      onFocus={() => {
                        if (predictions.length > 0) setPredictionsOpen(true)
                      }}
                      onBlur={() => {
                        // onPointerDown on prediction items uses preventDefault to keep
                        // the input focused, so this only fires when the user genuinely
                        // moves focus away.
                        setPredictionsOpen(false)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setPredictionsOpen(false)
                        } else if (event.key === "Enter" && predictions.length > 0) {
                          event.preventDefault()
                          handlePredictionSelect(predictions[0])
                        }
                      }}
                      placeholder="Search a town, village, road, or landmark"
                      className="h-11 pl-9 pr-10"
                      autoComplete="off"
                      disabled={!mapsReady}
                    />
                    {predictionsLoading ? (
                      <Loader2 className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 animate-spin text-slate-400" />
                    ) : null}
                    {predictionsOpen ? (
                      <div
                        className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg"
                        role="listbox"
                      >
                        {predictionsLoading && predictions.length === 0 ? (
                          <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Searching...
                          </div>
                        ) : predictions.length === 0 ? (
                          <div className="px-3 py-3 text-sm text-slate-500">
                            No matches. Try a different town, road, or landmark.
                          </div>
                        ) : (
                          predictions.map((prediction) => (
                            <button
                              type="button"
                              key={prediction.placeId}
                              // onPointerDown + preventDefault keeps focus on the
                              // input so onBlur doesn't close the list before our
                              // onClick handler can run. Works for mouse AND touch.
                              onPointerDown={(event) => event.preventDefault()}
                              onClick={() => handlePredictionSelect(prediction)}
                              className="flex w-full min-h-[44px] items-start gap-2 px-3 py-2.5 text-left hover:bg-agri-50 focus:bg-agri-50 focus:outline-none"
                              style={{ touchAction: "manipulation" }}
                              role="option"
                              aria-selected="false"
                            >
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-agri-600" />
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-slate-900">
                                  {prediction.mainText}
                                </div>
                                {prediction.secondaryText ? (
                                  <div className="truncate text-xs text-slate-500">
                                    {prediction.secondaryText}
                                  </div>
                                ) : null}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* Map container.
                      CRITICAL: keep the id attribute. The Terra Draw Google
                      Maps adapter looks it up when wiring its OverlayView. */}
                  <div className="relative h-[360px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <div
                      id={MAP_CONTAINER_ID}
                      ref={setMapContainer}
                      className="h-full w-full"
                    />
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
                          <div className="font-semibold text-slate-950">Map could not load</div>
                          <div className="mt-1">
                            {mapsError ||
                              "Check your network or try again. You can still enter coordinates manually."}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={() => setView("manual")}
                          >
                            <Keyboard className="mr-1.5 h-4 w-4" />
                            Enter coordinates manually
                          </Button>
                        </div>
                      </div>
                    ) : null}
                    {step === "drawing" ? (
                      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 rounded-lg bg-agri-900/90 px-3 py-2 text-sm font-medium text-white shadow">
                        Tap each corner of your farm. Press Enter (or tap the first point again)
                        to finish.
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

                  {mapsError && mapStatus !== "failed" ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      <div className="flex gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{mapsError}</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Step-specific action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {step === "drawing" ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleUndo}
                          disabled={points.length === 0}
                        >
                          <Undo2 className="mr-2 h-4 w-4" />
                          Undo last point
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleCancelDrawing}
                        >
                          Cancel drawing
                        </Button>
                      </>
                    ) : step === "confirm" ? (
                      <>
                        <Button
                          type="button"
                          onClick={handleApprove}
                          disabled={!hasMinBoundary}
                          className="bg-agri-700 hover:bg-agri-800"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve and save
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleStartOver}
                          disabled={!canDraw}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Start over
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleStartDrawing}
                        disabled={!canDraw}
                        className="bg-agri-700 hover:bg-agri-800"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Draw farm boundary
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onOpenChange(false)}
                      className="ml-auto"
                    >
                      Cancel
                    </Button>
                  </div>

                  {!canDraw && step !== "drawing" && step !== "confirm" ? (
                    <p className="text-xs font-medium text-slate-500">
                      {mapStatus === "ready"
                        ? "Preparing drawing tools..."
                        : "Waiting for the map to finish loading..."}
                    </p>
                  ) : null}
                </div>

                {/* Side panel: status + summary */}
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-950">Boundary preview</div>
                    <div className="mt-2 text-sm text-slate-600">
                      {points.length === 0
                        ? "No boundary captured yet."
                        : points.length < MIN_BOUNDARY_POINTS
                          ? `${points.length} point${points.length === 1 ? "" : "s"} so far. Add at least ${MIN_BOUNDARY_POINTS} to form a boundary.`
                          : `${points.length} boundary points captured.`}
                    </div>
                    {formatArea(areaAcres) ? (
                      <div className="mt-2 rounded-lg bg-agri-50 px-3 py-2 text-sm font-semibold text-agri-800">
                        Approximate area: {formatArea(areaAcres)}
                      </div>
                    ) : null}
                  </div>

                  {(manualLat || manualLng) && step !== "drawing" ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                      <div className="font-semibold text-slate-950">Current centre</div>
                      <div className="mt-1 text-slate-600">
                        {manualLat && manualLng
                          ? `${manualLat}, ${manualLng}`
                          : "Pick a place from the search to set a centre."}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                    <div className="font-semibold text-slate-700">Tips</div>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      <li>Switch the map type to Satellite to see field outlines.</li>
                      <li>Zoom in tight before drawing so corners are accurate.</li>
                      <li>You need at least {MIN_BOUNDARY_POINTS} points to save a boundary.</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    Map service is not configured for this site. Use the manual entry option
                    instead.
                    <div className="mt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setView("manual")}
                      >
                        <Keyboard className="mr-1.5 h-4 w-4" />
                        Enter coordinates manually
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function StepIndicator({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      {STEP_LABELS.map((entry, index) => {
        const state = index === currentIndex ? "current" : index < currentIndex ? "done" : "upcoming"
        return (
          <Fragment key={entry.key}>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium",
                state === "current" && "bg-agri-100 text-agri-900",
                state === "done" && "text-agri-700",
                state === "upcoming" && "text-slate-400",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                  state === "current" && "bg-agri-700 text-white",
                  state === "done" && "bg-agri-100 text-agri-700",
                  state === "upcoming" && "bg-slate-100 text-slate-500",
                )}
              >
                {index + 1}
              </span>
              {entry.label}
            </span>
            {index < STEP_LABELS.length - 1 ? (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
            ) : null}
          </Fragment>
        )
      })}
    </div>
  )
}
