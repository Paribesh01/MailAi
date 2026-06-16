import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { StatsView } from "@/components/stats/stats-view"

export default async function StatsPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  return <StatsView />
}
