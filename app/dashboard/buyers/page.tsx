import { BuyersPage } from "@/components/buyers/buyers-page"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"

export default function BuyersRoute() {
  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <BuyersPage />
    </DashboardLayout>
  )
}
