"use client"

import { useEffect, useState } from "react"
import { CalendarDays, ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import type { Event } from "@/lib/types/event"
import { EventFormDialog } from "./event-form-dialog"

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Invalid date"
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function isPast(value: string): boolean {
  return new Date(value).getTime() < Date.now()
}

function getRegistrationLink(event: Event): string {
  return event.registrationLink || event.registration_link || "#"
}

export function AdminEventsPage() {
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadEvents = async () => {
    setLoading(true)
    try {
      const data = await apiClient.getAdminEvents()
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

  useEffect(() => {
    loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openNewForm = () => {
    setSelectedEvent(null)
    setFormOpen(true)
  }

  const openEditForm = (event: Event) => {
    setSelectedEvent(event)
    setFormOpen(true)
  }

  const deleteEvent = async () => {
    if (!eventToDelete) return

    setDeleting(true)
    try {
      await apiClient.deleteAdminEvent(eventToDelete.id)
      toast({ title: "Event deleted", description: "The event was removed." })
      setEventToDelete(null)
      await loadEvents()
    } catch (error: any) {
      toast({
        title: "Could not delete event",
        description: error?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-agri-900">Manage Events</h1>
          <p className="text-muted-foreground mt-1">Create, edit, and remove Farm Mall events.</p>
        </div>
        <Button onClick={openNewForm} className="bg-agri-600 hover:bg-agri-700">
          <Plus className="mr-2 h-4 w-4" /> New event
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading events...
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center text-center py-14 px-6">
              <div className="h-14 w-14 rounded-full bg-agri-100 flex items-center justify-center mb-4">
                <CalendarDays className="h-7 w-7 text-agri-600" />
              </div>
              <h3 className="font-semibold text-agri-900">No events yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">
                Create your first event to publish it for users.
              </p>
              <Button onClick={openNewForm} className="bg-agri-600 hover:bg-agri-700">Create event</Button>
            </div>
          ) : (
            <>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => {
                    const past = isPast(event.date)

                    return (
                      <TableRow key={event.id} className={past ? "bg-muted/40 text-muted-foreground" : ""}>
                        <TableCell className="font-medium min-w-[220px]">
                          <div className="flex items-center gap-2">
                            <span>{event.name}</span>
                            {past ? <Badge variant="secondary">Past</Badge> : null}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[170px]">{formatDate(event.date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.mode === "physical" ? "Physical" : "Online"}</Badge>
                        </TableCell>
                        <TableCell className="min-w-[140px]">{event.mode === "physical" ? event.location || "-" : "-"}</TableCell>
                        <TableCell>
                          <Button asChild variant="ghost" size="sm">
                            <a href={getRegistrationLink(event)} target="_blank" rel="noreferrer">
                              Open <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditForm(event)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setEventToDelete(event)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-3 p-3 md:hidden">
              {events.map((event) => {
                const past = isPast(event.date)

                return (
                  <div
                    key={event.id}
                    className={`rounded-lg border p-4 ${past ? "bg-muted/40 text-muted-foreground" : "bg-background"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-semibold text-agri-900 break-words">{event.name}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{formatDate(event.date)}</p>
                      </div>
                      {past ? <Badge variant="secondary" className="shrink-0">Past</Badge> : null}
                    </div>

                    <div className="mt-3 grid gap-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Mode</span>
                        <Badge variant="outline">{event.mode === "physical" ? "Physical" : "Online"}</Badge>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-muted-foreground">Location</span>
                        <span className="text-right">{event.mode === "physical" ? event.location || "-" : "-"}</span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button asChild variant="outline" className="h-11">
                        <a href={getRegistrationLink(event)} target="_blank" rel="noreferrer">
                          Open <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                        </a>
                      </Button>
                      <Button variant="outline" className="h-11" onClick={() => openEditForm(event)}>
                        <Pencil className="mr-1.5 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        className="col-span-2 h-11"
                        onClick={() => setEventToDelete(event)}
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
            </>
          )}
        </CardContent>
      </Card>

      <EventFormDialog
        open={formOpen}
        event={selectedEvent}
        onOpenChange={setFormOpen}
        onSaved={loadEvents}
      />

      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {eventToDelete?.name} from the admin list and the user-facing Events page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteEvent} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
