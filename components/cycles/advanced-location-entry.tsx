"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { importLibrary, setOptions } from "@googlemaps/js-api-loader"
import {
  TerraDraw,
  TerraDrawModeUndoRedo,
  TerraDrawPolygonMode,
  TerraDrawUndoRedoKeyboardShortcuts,
} from "terra-draw"
import { TerraDrawGoogleMapsAdapter } from "terra-draw-google-maps-adapter"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, MapPin, Plus, RotateCcw, Save, Search, Trash2, Undo2 } from "lucide-react"

export type BoundaryPoint = { lat: number; lng: number }
type BoundaryRow = { lat: string; lng: string }

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

  const [mapsReady, setMapsReady] = useState(false)
  const [mapsLoading, setMapsLoading] = useState(false)
  const [mapsError, setMapsError] = useState<string | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [manualLat, setManualLat] = useState(latitude?.toString() || "")
  const [manualLng, setManualLng] = useState(longitude?.toString() || "")
  const [points, setPoints] = useState<BoundaryPoint[]>(boundary)
  const [manualBoundaryRows, setManualBoundaryRows] = useState<BoundaryRow[]>(boundaryPointsToRows(boundary))
  const [manualBoundaryError, setManualBoundaryError] = useState<string | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const approximateQuery = useMemo(
    () => [locationName, subcounty, county, "Kenya"].filter(Boolean).join(", "),
    [county, locationName, subcounty]
  )

  useEffect(() => {
    if (!open) return
    setManualLat(latitude?.toString() || "")
    setManualLng(longitude?.toString() || "")
    setPoints(boundary)
    setManualBoundaryRows(boundaryPointsToRows(boundary))
    setManualBoundaryError(null)
  }, [boundary, latitude, longitude, open])

  useEffect(() => {
    if (open && !apiKey) {
      console.info(
        "Google Maps is not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable map search and drawing."
      )
    }
  }, [apiKey, open])

  useEffect(() => {
    if (!open || !apiKey || !mapContainerRef.current) return

    let cancelled = false
    let draw: TerraDraw | null = null
    let autocomplete: google.maps.places.Autocomplete | null = null
    let mapListeners: google.maps.MapsEventListener[] = []
    const previousAuthFailure = typeof window !== "undefined" ? (window as any).gm_authFailure : undefined

    if (typeof window !== "undefined") {
      ;(window as any).gm_authFailure = () => {
        setMapsLoading(false)
        setMapsReady(false)
        setMapsError(
          "Google Maps could not authenticate this browser key. Check API key restrictions, billing, and enabled Maps JavaScript/Places APIs."
        )
        if (typeof previousAuthFailure === "function") previousAuthFailure()
      }
    }

    async function loadMap() {
      try {
        setMapsError(null)
        setMapsLoading(true)
        setMapsReady(false)
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

        if (searchInputRef.current) {
          searchInputRef.current.value = approximateQuery
          const nextAutocomplete = new maps.places.Autocomplete(searchInputRef.current, {
            componentRestrictions: { country: "ke" },
            fields: ["geometry", "name", "formatted_address"],
          })
          autocomplete = nextAutocomplete
          autocomplete.bindTo("bounds", map)
          mapListeners.push(nextAutocomplete.addListener("place_changed", () => {
            const place = nextAutocomplete.getPlace()
            const location = place?.geometry?.location
            if (!location) return
            map.setCenter(location)
            map.setZoom(18)
            setManualLat(location.lat().toFixed(6))
            setManualLng(location.lng().toFixed(6))
          }))
        }

        let tilesLoaded = false
        mapListeners.push(maps.event.addListenerOnce(map, "tilesloaded", () => {
          tilesLoaded = true
          setMapsLoading(false)
        }))
        window.setTimeout(() => {
          if (!cancelled && mapRef.current === map && !tilesLoaded) {
            setMapsLoading(false)
          }
        }, 6000)

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

        setMapsReady(true)
        setMapsLoading(false)
      } catch (error: any) {
        setMapsLoading(false)
        setMapsReady(false)
        setMapsError(error?.message || "Could not load Google Maps.")
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
      setMapsReady(false)
      setMapsLoading(false)
      setDrawing(false)
    }
  }, [apiKey, approximateQuery, latitude, longitude, open])

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

  const handleDraw = () => {
    previewPolygonRef.current?.setMap(null)
    drawRef.current?.clear()
    drawRef.current?.setMode("farm-boundary")
    setPoints([])
    setManualBoundaryRows(createEmptyBoundaryRows())
    setManualBoundaryError(null)
    setDrawing(true)
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
                    placeholder="Search farm area, trading centre, or village"
                    className="h-11 pl-9"
                  />
                </div>
                <div className="relative h-[360px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <div ref={mapContainerRef} className="h-full w-full" />
                  {mapsLoading ? (
                    <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-agri-800 shadow">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading map...
                      </div>
                    </div>
                  ) : null}
                </div>
                {mapsError ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <div className="flex gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{mapsError}. You can still enter the farm boundary manually.</span>
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={handleDraw}
                    disabled={!mapsReady}
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
