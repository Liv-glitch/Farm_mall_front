import { FarmToolsPage } from "@/components/farm-tools/farm-tools-page"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"

export default function FarmToolsRoute() {
  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <FarmToolsPage />
    </DashboardLayout>
  )
}
