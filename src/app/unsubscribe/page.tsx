import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { UnsubscribeView } from "@/components/unsubscribe/unsubscribe-view"

export default async function UnsubscribePage() {
  const session = await getSession()
  if (!session) redirect("/login")
  return <UnsubscribeView />
}
