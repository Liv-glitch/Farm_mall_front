"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Leaf, HeartPulse } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { toast } from "@/components/ui/use-toast"

interface PlantAIModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "identify" | "health"
}

export function PlantAIModal({ open, onOpenChange, mode }: PlantAIModalProps) {
  const [image, setImage] = useState<File | null>(null)
  const [latitude, setLatitude] = useState<string>("")
  const [longitude, setLongitude] = useState<string>("")
  const [similarImages, setSimilarImages] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [zoomImage, setZoomImage] = useState<string | null>(null)

  const reset = () => {
    setImage(null)
    setLatitude("")
    setLongitude("")
    setSimilarImages(false)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      if (!image) {
        setError("Please upload a plant image.")
        setLoading(false)
        return
      }
      const lat = latitude ? parseFloat(latitude) : undefined
      const lng = longitude ? parseFloat(longitude) : undefined
      let res
      if (mode === "identify") {
        res = await apiClient.identifyPlant({ image, latitude: lat, longitude: lng, similar_images: similarImages })
      } else {
        res = await apiClient.assessPlantHealth({ image, latitude: lat, longitude: lng, similar_images: similarImages })
      }
      setResult(res)
    } catch (err: any) {
      setError(err.message || "Failed to get result.")
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const title = mode === "identify" ? "Identify Plant" : "Assess Plant Health"
  const icon = mode === "identify" ? <Leaf className="w-5 h-5 text-green-600" /> : <HeartPulse className="w-5 h-5 text-red-600" />
  const description = mode === "identify"
    ? "Upload a plant image to identify its species. Optionally, provide location."
    : "Upload a plant image to assess its health or detect disease. Optionally, provide location."

  return (
    <Dialog open={open} onOpenChange={o => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">{icon}<span>{title}</span></DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="plant-image">Plant Image *</Label>
            <Input
              id="plant-image"
              type="file"
              accept="image/*"
              required
              ref={fileInputRef}
              onChange={e => setImage(e.target.files?.[0] || null)}
              disabled={loading}
            />
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                min={-90}
                max={90}
                placeholder="e.g. -1.2921"
                value={latitude}
                onChange={e => setLatitude(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                min={-180}
                max={180}
                placeholder="e.g. 36.8219"
                value={longitude}
                onChange={e => setLongitude(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              id="similar-images"
              type="checkbox"
              checked={similarImages}
              onChange={e => setSimilarImages(e.target.checked)}
              disabled={loading}
              className="h-4 w-4"
            />
            <Label htmlFor="similar-images" className="text-sm">Return similar images</Label>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            {title}
          </Button>
        </form>
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        {result && mode === "identify" && (
          <div className="mt-4 p-3 rounded bg-muted text-sm max-h-96 overflow-y-auto">
            {result.result?.classification?.suggestions?.length > 0 ? (
              <div className="space-y-4">
                {result.result.classification.suggestions.slice(0, 3).map((s: any, i: number) => (
                  <div key={s.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center space-x-3">
                      {s.details?.image?.value && (
                        <img src={s.details.image.value} alt={s.name} className="w-16 h-16 object-cover rounded border cursor-pointer" onClick={() => setZoomImage(s.details.image.value)} />
                      )}
                      <div>
                        <div className="font-semibold text-base text-foreground">{s.name}</div>
                        {s.details?.common_names && (
                          <div className="text-xs text-muted-foreground mb-1">
                            Also known as: {s.details.common_names.slice(0, 3).join(", ")}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">Probability: {(s.probability * 100).toFixed(1)}%</div>
                        {s.details?.description?.value && (
                          <div className="mt-1 text-xs text-foreground">
                            {s.details.description.value}
                          </div>
                        )}
                        {s.details?.taxonomy && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium">Family:</span> {s.details.taxonomy.family}, <span className="font-medium">Genus:</span> {s.details.taxonomy.genus}
                          </div>
                        )}
                        {s.details?.url && (
                          <a href={s.details.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline mt-1 inline-block">Learn more</a>
                        )}
                      </div>
                    </div>
                    {s.similar_images?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {s.similar_images.slice(0, 4).map((img: any) => (
                          <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                            <img src={img.url_small || img.url} alt="Similar" className="w-12 h-12 object-cover rounded border cursor-pointer" onClick={e => { e.preventDefault(); setZoomImage(img.url); }} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div>No plant suggestions found.</div>
            )}
          </div>
        )}
        {result && mode === "health" && (
          <div className="mt-4 p-3 rounded bg-muted text-sm max-h-96 overflow-y-auto">
            {result.result?.disease?.suggestions?.length > 0 ? (
              <div className="space-y-4">
                {result.result.disease.suggestions.slice(0, 3).map((s: any, i: number) => (
                  <div key={s.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center space-x-3">
                      {s.similar_images?.[0]?.url_small && (
                        <img src={s.similar_images[0].url_small} alt={s.name} className="w-16 h-16 object-cover rounded border cursor-pointer" onClick={() => setZoomImage(s.similar_images[0].url)} />
                      )}
                      <div>
                        <div className="font-semibold text-base text-foreground">{s.details?.local_name || s.name}</div>
                        <div className="text-xs text-muted-foreground">Probability: {(s.probability * 100).toFixed(1)}%</div>
                        {s.details?.classification?.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">Type:</span> {s.details.classification.join(", ")}
                          </div>
                        )}
                        {s.details?.description && (
                          <div className="mt-1 text-xs text-foreground">
                            {s.details.description}
                          </div>
                        )}
                        {s.details?.url && (
                          <a href={s.details.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline mt-1 inline-block">Learn more</a>
                        )}
                      </div>
                    </div>
                    {s.similar_images?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {s.similar_images.slice(0, 4).map((img: any) => (
                          <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                            <img src={img.url_small || img.url} alt="Similar" className="w-12 h-12 object-cover rounded border cursor-pointer" onClick={e => { e.preventDefault(); setZoomImage(img.url); }} />
                          </a>
                        ))}
                      </div>
                    )}
                    {s.details?.treatment && (
                      <div className="mt-2 text-xs">
                        {s.details.treatment.chemical?.length > 0 && (
                          <div className="mb-1">
                            <span className="font-medium">Chemical Treatment:</span>
                            <ul className="list-disc ml-5">
                              {s.details.treatment.chemical.map((t: string, idx: number) => (
                                <li key={idx}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {s.details.treatment.biological?.length > 0 && (
                          <div className="mb-1">
                            <span className="font-medium">Biological Treatment:</span>
                            <ul className="list-disc ml-5">
                              {s.details.treatment.biological.map((t: string, idx: number) => (
                                <li key={idx}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {s.details.treatment.prevention?.length > 0 && (
                          <div>
                            <span className="font-medium">Prevention:</span>
                            <ul className="list-disc ml-5">
                              {s.details.treatment.prevention.map((t: string, idx: number) => (
                                <li key={idx}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div>No health issues detected or no suggestions found.</div>
            )}
            {/* Show question if present */}
            {result.result?.disease?.question?.text && (
              <div className="mt-4 p-2 rounded bg-background border">
                <div className="font-medium mb-1">Question:</div>
                <div className="mb-2">{result.result.disease.question.text}</div>
                {result.result.disease.question.options && (
                  <div className="flex flex-col gap-1">
                    {Object.entries(result.result.disease.question.options).map(([key, opt]: any) => (
                      <div key={key} className="text-xs bg-muted px-2 py-1 rounded">
                        <span className="font-medium capitalize">{key}:</span> {opt.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* Image Zoom Dialog */}
        <Dialog open={!!zoomImage} onOpenChange={o => { if (!o) setZoomImage(null) }}>
          <DialogContent className="max-w-lg w-full flex flex-col items-center justify-center bg-black/95">
            {zoomImage && (
              <img src={zoomImage} alt="Zoomed" className="max-h-[80vh] max-w-full rounded shadow-lg" />
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
} 