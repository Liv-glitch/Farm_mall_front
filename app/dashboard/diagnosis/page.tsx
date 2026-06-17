import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { DiagnosisPage } from "@/components/diagnosis/diagnosis-page"

export default function DiagnosisRoute() {
  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <DiagnosisPage />
    </DashboardLayout>
  )
}
