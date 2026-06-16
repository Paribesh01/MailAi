import { getSession } from "@/lib/session"
import { InboxView } from "@/components/inbox/inbox-view"

export default async function InboxPage() {
  const session = await getSession()
  return <InboxView userName={session!.user.name} userEmail={session!.user.email} />
}
