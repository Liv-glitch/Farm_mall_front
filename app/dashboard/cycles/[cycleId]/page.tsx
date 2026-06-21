import { redirect } from "next/navigation"

export default function CropTrackerDetailFallback() {
  redirect("/dashboard/cycles")
}
