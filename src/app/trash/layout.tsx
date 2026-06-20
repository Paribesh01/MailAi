import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { Sidebar } from "@/components/layout/sidebar"
import { hasRequiredGmailScopes } from "@/lib/gmail-scopes"

export default async function TrashLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")
  const scopesOk = await hasRequiredGmailScopes(session.user.id)
  if (!scopesOk) redirect("/reauth")
  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar user={session.user} />
      <main className="flex-1 flex flex-col overflow-y-auto">{children}</main>
    </div>
  )
}
