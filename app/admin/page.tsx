import { AdminRouteGuard } from "@/components/admin/admin-route-guard"
import { AdminOverviewPage } from "@/components/admin/admin-overview-page"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { DashboardLayout } from "@/components/shared/dashboard-layout"

export default function AdminRoute() {
  return (
    <AdminRouteGuard>
      <DashboardLayout sidebar={<AdminSidebar />}>
        <AdminOverviewPage />
      </DashboardLayout>
    </AdminRouteGuard>
  )
}
