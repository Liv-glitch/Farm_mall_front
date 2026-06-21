import { CropTrackerPage } from "@/components/cycles/crop-tracker-page"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"

export default function CropTrackerRoute() {
  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <CropTrackerPage />
    </DashboardLayout>
  )
}
