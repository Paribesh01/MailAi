import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { SentView } from "@/components/inbox/sent-view"

export default async function SentPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  return <SentView />
}
