import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { PreproductionPlanningPage } from "@/components/pre-production-planning/pre-production-planning-page"

export default function PreproductionPlanningRoute() {
  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <PreproductionPlanningPage />
    </DashboardLayout>
  )
}
