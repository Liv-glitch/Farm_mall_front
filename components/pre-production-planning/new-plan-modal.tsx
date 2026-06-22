"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CalendarDays, MapPin, Sprout, Tag } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import { POTATO_VARIETIES, type PotatoVariety, type PreproductionPlan } from "@/lib/types/preproduction"

interface NewPlanModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NewPlanModal({ isOpen, onClose }: NewPlanModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    planting_date: string
    location: string
    potato_variety: PotatoVariety
  }>({
    name: "",
    planting_date: "",
    location: "",
    potato_variety: "Shangi",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.planting_date || !formData.location.trim() || !formData.potato_variety) {
      toast({
        title: "Missing details",
        description: "Please fill in the plan name, planting date, location and variety.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const plan = (await apiClient.createPreproductionPlan(formData)) as PreproductionPlan
      toast({ title: "Plan created", description: "Your farm preparation checklist is ready." })
      onClose()
      setFormData({ name: "", planting_date: "", location: "", potato_variety: "Shangi" })
      router.push(`/dashboard/pre-production-planning/${plan.id}`)
    } catch (error: any) {
      toast({
        title: "Could not create plan",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New planting plan</DialogTitle>
          <DialogDescription>
            Tell us a few details. We&apos;ll build a personalised farm preparation checklist.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan-name" className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-agri-600" /> Plan name
            </Label>
            <Input
              id="plan-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Long rains – Njoro field"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-date" className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-agri-600" /> When do you plan to plant?
            </Label>
            <Input
              id="plan-date"
              type="date"
              value={formData.planting_date}
              onChange={(e) => setFormData({ ...formData, planting_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-location" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-agri-600" /> Where is the farm?
            </Label>
            <Input
              id="plan-location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Nakuru, Bahati ward"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-variety" className="flex items-center gap-1.5">
              <Sprout className="h-3.5 w-3.5 text-agri-600" /> Potato variety
            </Label>
            <Select
              value={formData.potato_variety}
              onValueChange={(value: PotatoVariety) => setFormData({ ...formData, potato_variety: value })}
            >
              <SelectTrigger id="plan-variety">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POTATO_VARIETIES.map((variety) => (
                  <SelectItem key={variety} value={variety}>
                    {variety}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
                </>
              ) : (
                "Create plan"
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
