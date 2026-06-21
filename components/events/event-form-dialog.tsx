"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import type { Event, EventFormData, EventMode } from "@/lib/types/event"

interface EventFormDialogProps {
  open: boolean
  event?: Event | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

const emptyForm: EventFormData = {
  name: "",
  date: "",
  mode: "online",
  location: "",
  registration_link: "",
  description: "",
}

function getRegistrationLink(event: Event): string {
  return event.registrationLink || event.registration_link || ""
}

function toInputDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 16)
}

export function EventFormDialog({ open, event, onOpenChange, onSaved }: EventFormDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<EventFormData>(emptyForm)

  useEffect(() => {
    if (!open) return

    if (event) {
      setFormData({
        name: event.name,
        date: toInputDate(event.date),
        mode: event.mode,
        location: event.location || "",
        registration_link: getRegistrationLink(event),
        description: event.description,
      })
    } else {
      setFormData(emptyForm)
    }
  }, [event, open])

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault()

    if (formData.mode === "physical" && !formData.location.trim()) {
      toast({
        title: "Location required",
        description: "Physical events need a location.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        location: formData.mode === "physical" ? formData.location : "",
      }

      if (event) {
        await apiClient.updateAdminEvent(event.id, payload)
        toast({ title: "Event updated", description: "The event details were saved." })
      } else {
        await apiClient.createAdminEvent(payload)
        toast({ title: "Event created", description: "The event is now visible until its date passes." })
      }

      onSaved()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: event ? "Could not update event" : "Could not create event",
        description: error?.message || "Please check the form and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "Edit event" : "New event"}</DialogTitle>
          <DialogDescription>
            Events are published immediately and disappear from the user-facing page after their date passes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-name">Name</Label>
            <Input
              id="event-name"
              value={formData.name}
              onChange={(e) => setFormData((current) => ({ ...current, name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-date">Date and time</Label>
              <Input
                id="event-date"
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData((current) => ({ ...current, date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-mode">Mode</Label>
              <Select
                value={formData.mode}
                onValueChange={(value: EventMode) => setFormData((current) => ({ ...current, mode: value }))}
              >
                <SelectTrigger id="event-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.mode === "physical" ? (
            <div className="space-y-2">
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                value={formData.location}
                onChange={(e) => setFormData((current) => ({ ...current, location: e.target.value }))}
                required
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="event-link">Registration link</Label>
            <Input
              id="event-link"
              type="url"
              value={formData.registration_link}
              onChange={(e) => setFormData((current) => ({ ...current, registration_link: e.target.value }))}
              placeholder="https://..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Description</Label>
            <Textarea
              id="event-description"
              value={formData.description}
              onChange={(e) => setFormData((current) => ({ ...current, description: e.target.value }))}
              rows={5}
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button type="submit" disabled={loading} className="bg-agri-600 hover:bg-agri-700">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save event"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
