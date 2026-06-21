"use client"

import { useEffect, useState } from "react"
import { CalendarDays, ExternalLink, Loader2, MapPin, Monitor, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import type { Event } from "@/lib/types/event"

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-agri-900">Events</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Upcoming Farm Mall trainings, workshops, and meetups.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading events...
        </div>
      ) : events.length === 0 ? (
        <Card className="border-dashed border-2 border-agri-200 bg-agri-50/40">
          <CardContent className="flex flex-col items-center text-center py-14 px-6">
            <div className="h-14 w-14 rounded-full bg-agri-100 flex items-center justify-center mb-4">
              <CalendarDays className="h-7 w-7 text-agri-600" />
            </div>
            <h3 className="font-semibold text-agri-900">No upcoming events right now.</h3>
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
              <Card key={event.id} className="border border-agri-100 hover:border-agri-300 transition-colors">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-agri-900">{event.name}</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4" /> {formatEventDate(event.date)}
                        </span>
                      </div>
                    </div>
                    <Badge className={isPhysical ? "bg-warm-100 text-warm-800 hover:bg-warm-100" : "bg-agri-100 text-agri-700 hover:bg-agri-100"}>
                      {isPhysical ? <Users className="mr-1 h-3 w-3" /> : <Monitor className="mr-1 h-3 w-3" />}
                      {isPhysical ? "Physical" : "Online"}
                    </Badge>
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
                    <Button asChild className="bg-agri-600 hover:bg-agri-700 sm:w-auto">
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
