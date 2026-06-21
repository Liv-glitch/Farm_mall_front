import { EventsPage } from "@/components/events/events-page"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"

export default function EventsRoute() {
  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <EventsPage />
    </DashboardLayout>
  )
}
