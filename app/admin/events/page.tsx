import { AdminRouteGuard } from "@/components/admin/admin-route-guard"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminEventsPage } from "@/components/events/admin-events-page"
import { DashboardLayout } from "@/components/shared/dashboard-layout"

export default function AdminEventsRoute() {
  return (
    <AdminRouteGuard>
      <DashboardLayout sidebar={<AdminSidebar />}>
        <AdminEventsPage />
      </DashboardLayout>
    </AdminRouteGuard>
  )
}
