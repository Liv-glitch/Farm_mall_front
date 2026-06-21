import { redirect } from "next/navigation"

export default function HomeRoute() {
  redirect("/auth/login")
}
