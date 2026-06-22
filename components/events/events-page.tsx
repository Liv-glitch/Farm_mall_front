"use client"

import { useEffect, useState } from "react"
import { CalendarDays, ExternalLink, Loader2, MapPin, Monitor, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import type { Event } from "@/lib/types/event"

const EVENT_IMAGE_URL =
  "https://images.unsplash.com/photo-1625324455604-d75faf4b119b?w=1200&auto=format&fit=crop&q=80&ixlib=rb-4.1.0"

function formatEventDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date coming soon"
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getRegistrationLink(event: Event): string {
  return event.registrationLink || event.registration_link || "#"
}

export function EventsPage() {
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true)
      try {
        const data = await apiClient.getEvents()
        setEvents(Array.isArray(data) ? data : [])
      } catch (error: any) {
        toast({
          title: "Failed to load events",
          description: error?.message || "Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [toast])

  return (
    <div className="page-shell">
      <div>
        <h1 className="page-title">Events</h1>
        <p className="page-subtitle">
          Upcoming Farm Mall trainings, workshops, and meetups.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading events...
        </div>
      ) : events.length === 0 ? (
        <Card className="border-0 bg-white">
          <CardContent className="flex flex-col items-center text-center py-14 px-6">
            <div className="mb-5 h-28 w-full max-w-sm overflow-hidden rounded-2xl shadow-card">
              <img src={EVENT_IMAGE_URL} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="h-14 w-14 rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
              <CalendarDays className="h-7 w-7 text-primary-700" />
            </div>
            <h3 className="font-extrabold text-primary-900">No upcoming events right now.</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Check back soon for new trainings and community sessions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => {
            const isExpanded = expandedEventId === event.id
            const isPhysical = event.mode === "physical"

            return (
              <Card key={event.id} className="overflow-hidden border-0 transition-all hover:-translate-y-1 hover:shadow-card">
                <div className="photo-card-image m-3 mb-0 aspect-[16/9]">
                  <img src={EVENT_IMAGE_URL} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-950/70 via-primary-950/10 to-transparent" />
                  <Badge className={isPhysical ? "absolute bottom-3 left-3 bg-amber-100 text-amber-800 hover:bg-amber-100" : "absolute bottom-3 left-3 bg-white/90 text-primary-900 hover:bg-white"}>
                    {isPhysical ? <Users className="mr-1 h-3 w-3" /> : <Monitor className="mr-1 h-3 w-3" />}
                    {isPhysical ? "Physical" : "Online"}
                  </Badge>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-extrabold text-primary-900">{event.name}</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4" /> {formatEventDate(event.date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isPhysical && event.location ? (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  ) : null}

                  <p className={`text-sm text-muted-foreground ${isExpanded ? "" : "line-clamp-2"}`}>
                    {event.description}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                      className="sm:w-auto"
                    >
                      {isExpanded ? "Hide details" : "View details"}
                    </Button>
                    <Button asChild className="sm:w-auto">
                      <a href={getRegistrationLink(event)} target="_blank" rel="noreferrer">
                        Register <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
