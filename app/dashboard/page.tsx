import { OverviewPage } from "@/components/dashboard/overview-page"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"

export default function DashboardOverviewRoute() {
  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <OverviewPage />
    </DashboardLayout>
  )
}
