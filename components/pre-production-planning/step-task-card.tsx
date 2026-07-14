"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Circle, ExternalLink, Info, Loader2, CalendarCheck, Coins, Truck, ListChecks } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import { useAuth } from "@/lib/hooks/use-auth"
import type { PreproductionPlan, PreproductionTask } from "@/lib/types/preproduction"

interface StepTaskCardProps {
  task: PreproductionTask
  onUpdated: (plan: PreproductionPlan) => void
}

export function StepTaskCard({ task, onUpdated }: StepTaskCardProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ date_completed: "", cost: "", supplier: "" })
  const isTask = task.activityType === "task"
  const recommendations = task.recommendations?.length
    ? task.recommendations
    : task.expertTip
      ? [task.expertTip]
      : []
  const serviceLinks = task.serviceLinks?.length
    ? task.serviceLinks
    : task.whatYouNeed && task.whatYouNeedLink
      ? [{ label: task.whatYouNeed, href: task.whatYouNeedLink }]
      : []

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date_completed) {
      toast({
        title: "Date required",
        description: "Please enter the date this task was completed.",
        variant: "destructive",
      })
      return
    }
    setSaving(true)
    try {
      const plan = (await apiClient.updatePreproductionTask(task.id, {
        completed: true,
        date_completed: form.date_completed,
        cost: form.cost ? Number(form.cost) : null,
        supplier: form.supplier || null,
      })) as PreproductionPlan
      onUpdated(plan)
      toast({ title: "Task completed" })
      setModalOpen(false)
      setForm({ date_completed: "", cost: "", supplier: "" })
    } catch (error: any) {
      toast({
        title: "Could not save",
        description: error?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUndo = async () => {
    setSaving(true)
    try {
      const plan = (await apiClient.updatePreproductionTask(task.id, { completed: false })) as PreproductionPlan
      onUpdated(plan)
    } catch (error: any) {
      toast({
        title: "Could not undo",
        description: error?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleMarketplaceLink = async (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    let url: URL
    try {
      url = new URL(href)
    } catch {
      return
    }

    if (url.hostname !== "inputs.farmmall.co.ke" || !user) return

    event.preventDefault()
    const popup = window.open("about:blank", "_blank")
    const redirect = `${url.pathname}${url.search}${url.hash}` || "/marketplace"

    try {
      const ssoUrl = await apiClient.createMarketplaceSsoUrl(redirect)
      if (popup) {
        popup.location.href = ssoUrl
      } else {
        window.open(ssoUrl, "_blank", "noopener,noreferrer")
      }
    } catch (error: any) {
      if (popup) {
        popup.location.href = href
      } else {
        window.open(href, "_blank", "noopener,noreferrer")
      }
      toast({
        title: "Opening marketplace",
        description: error?.message || "Single sign-on was unavailable, so the marketplace opened normally.",
      })
    }
  }

  return (
    <div className={`rounded-2xl p-4 shadow-soft transition-all ${task.completed ? "bg-primary-50" : "bg-white"}`}>
      <div className="flex items-start gap-3">
        {isTask && task.completed ? (
          <CheckCircle2 className="h-5 w-5 text-agri-600 shrink-0 mt-0.5" />
        ) : isTask ? (
          <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        ) : (
          <Info className="h-5 w-5 text-sky-700 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="font-extrabold text-primary-900">{task.title}</h4>
              {!isTask && (
                <span className="mt-1 inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800">
                  Informational
                </span>
              )}
            </div>
            {isTask && task.completed && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="status-pill bg-primary-100 text-primary-800">
                  Completed
                </span>
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={saving}
                  className="text-xs font-medium text-agri-700 underline underline-offset-2 hover:text-agri-900 disabled:opacity-50"
                >
                  Undo
                </button>
              </div>
            )}
          </div>

          <div className="text-sm">
            <div className="font-medium text-foreground/80 mb-0.5">Importance</div>
            <p className="text-muted-foreground">{task.importance || task.expertTip || task.whatYouNeed}</p>
          </div>

          {recommendations.length > 0 && (
            <div className="rounded-2xl bg-amber-50 p-3 text-sm shadow-soft">
              <div className="mb-1.5 flex items-center gap-1.5 font-medium text-foreground/80">
                <ListChecks className="h-4 w-4 text-maize-600" /> Recommendations
              </div>
              <ul className="space-y-1 text-muted-foreground">
                {recommendations.map((recommendation, index) => (
                  <li key={`${task.id}-recommendation-${index}`} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-maize-500" />
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {serviceLinks.length > 0 ? (
            <div className="text-sm">
              <div className="font-medium text-foreground/80 mb-1.5">Farm Mall Services</div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {serviceLinks.map((link) => (
                  <a
                    key={`${task.id}-${link.href}-${link.label}`}
                    href={link.href}
                    onClick={(event) => handleMarketplaceLink(event, link.href)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-1 rounded-full bg-primary-50 px-3 py-1.5 text-agri-700 hover:bg-primary-100 hover:text-agri-900"
                  >
                    {link.label} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>
          ) : task.whatYouNeed ? (
            <div className="text-sm">
              <div className="font-medium text-foreground/80 mb-0.5">Farm Mall Services</div>
              <p className="text-muted-foreground">{task.whatYouNeed}</p>
            </div>
          ) : null}

          {isTask && task.completed ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
              {task.dateCompleted && (
                <span className="inline-flex items-center gap-1">
                  <CalendarCheck className="h-3.5 w-3.5" /> {task.dateCompleted}
                </span>
              )}
              {task.cost != null && (
                <span className="inline-flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5" /> KSh {Number(task.cost).toLocaleString()}
                </span>
              )}
              {task.supplier && (
                <span className="inline-flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" /> {task.supplier}
                </span>
              )}
            </div>
          ) : isTask ? (
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Mark as done
            </Button>
          ) : null}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={(open) => !open && setModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{task.title}</DialogTitle>
            <DialogDescription>
              Only the completion date is required. Add cost and supplier if they apply.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-date" className="flex items-center gap-1.5">
                <CalendarCheck className="h-3.5 w-3.5 text-agri-600" /> Date completed
              </Label>
              <Input
                id="task-date"
                type="date"
                value={form.date_completed}
                onChange={(e) => setForm({ ...form, date_completed: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-cost" className="flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-agri-600" /> Cost (KSh) — optional
              </Label>
              <Input
                id="task-cost"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-supplier" className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-agri-600" /> Supplier / service provider — optional
              </Label>
              <Input
                id="task-supplier"
                placeholder="e.g. Kisima Farm Supplies"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
