import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { InboxView } from "@/components/inbox/inbox-view"

export default async function InboxPage() {
  // The layout redirects too, but Next renders layout and page in parallel
  const session = await getSession()
  if (!session) redirect("/login")
  return <InboxView userName={session.user.name} userEmail={session.user.email} />
}
