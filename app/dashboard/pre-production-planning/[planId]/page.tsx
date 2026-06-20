import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { PlanDetailPage } from "@/components/pre-production-planning/plan-detail-page"

export default function PreproductionPlanDetailRoute({
  params,
}: {
  params: { planId: string }
}) {
  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <PlanDetailPage planId={params.planId} />
    </DashboardLayout>
  )
}
