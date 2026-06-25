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
import { Textarea } from "@/components/ui/textarea"
import { MapPin, RotateCcw, Save, Search, Trash2, Undo2 } from "lucide-react"

export type BoundaryPoint = { lat: number; lng: number }

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

function parseBoundaryJson(value: string): BoundaryPoint[] {
  const parsed = JSON.parse(value)
  if (!Array.isArray(parsed)) return []
  return parsed
    .map((point) => ({
      lat: Number(point?.lat),
      lng: Number(point?.lng),
    }))
    .filter(
      (point) =>
        Number.isFinite(point.lat) &&
        Number.isFinite(point.lng) &&
        point.lat >= -90 &&
        point.lat <= 90 &&
        point.lng >= -180 &&
        point.lng <= 180
    )
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
  const [mapsError, setMapsError] = useState<string | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [manualLat, setManualLat] = useState(latitude?.toString() || "")
  const [manualLng, setManualLng] = useState(longitude?.toString() || "")
  const [points, setPoints] = useState<BoundaryPoint[]>(boundary)
  const [manualBoundaryText, setManualBoundaryText] = useState(
    boundary.length > 0 ? JSON.stringify(boundary, null, 2) : ""
  )

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
    setManualBoundaryText(boundary.length > 0 ? JSON.stringify(boundary, null, 2) : "")
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
    let placeListener: google.maps.MapsEventListener | null = null

    async function loadMap() {
      try {
        setMapsError(null)
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
          placeListener = nextAutocomplete.addListener("place_changed", () => {
            const place = nextAutocomplete.getPlace()
            const location = place?.geometry?.location
            if (!location) return
            map.setCenter(location)
            map.setZoom(18)
            setManualLat(location.lat().toFixed(6))
            setManualLng(location.lng().toFixed(6))
          })
        }

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
          setPoints(nextPoints)
          setManualBoundaryText(JSON.stringify(nextPoints, null, 2))
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
      } catch (error: any) {
        setMapsError(error?.message || "Could not load Google Maps.")
      }
    }

    void loadMap()

    return () => {
      cancelled = true
      placeListener?.remove()
      previewPolygonRef.current?.setMap(null)
      previewPolygonRef.current = null
      draw?.stop()
      drawRef.current = null
      mapRef.current = null
      mapsRef.current = null
      setMapsReady(false)
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
    setManualBoundaryText("")
    setDrawing(true)
  }

  const handleUndo = () => {
    drawRef.current?.undo()
    const nextPoints = drawRef.current ? getPolygonPoints(drawRef.current) : []
    setPoints(nextPoints)
    setManualBoundaryText(nextPoints.length > 0 ? JSON.stringify(nextPoints, null, 2) : "")
  }

  const handleClear = () => {
    drawRef.current?.clear()
    drawRef.current?.setMode("static")
    setDrawing(false)
    setPoints([])
    setManualBoundaryText("")
  }

  const handleManualBoundaryBlur = () => {
    if (!manualBoundaryText.trim()) {
      setPoints([])
      return
    }
    try {
      setPoints(parseBoundaryJson(manualBoundaryText))
    } catch {
      // Keep the user's text intact; validation happens on save.
    }
  }

  const handleSave = () => {
    let nextPoints = points
    if (manualBoundaryText.trim()) {
      try {
        nextPoints = parseBoundaryJson(manualBoundaryText)
      } catch {
        nextPoints = points
      }
    }

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
                <div className="h-[360px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <div ref={mapContainerRef} className="h-full w-full" />
                </div>
                {mapsError ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    {mapsError}. You can still enter coordinates manually.
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

            <div>
              <Label htmlFor="manual-boundary">Manual boundary points (optional)</Label>
              <Textarea
                id="manual-boundary"
                value={manualBoundaryText}
                onChange={(event) => setManualBoundaryText(event.target.value)}
                onBlur={handleManualBoundaryBlur}
                rows={8}
                className="mt-1 font-mono text-xs"
                placeholder={'[\n  { "lat": -0.3031, "lng": 36.08 }\n]'}
              />
              <p className="mt-1 text-xs text-slate-500">
                Use this only if map drawing is unavailable.
              </p>
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
