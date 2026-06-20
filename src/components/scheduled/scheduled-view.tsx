"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Clock, Loader2, Send, Trash2, RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface ScheduledEmail {
  id: string
  to: string
  subject: string
  scheduledAt: string
  status: string
  sentAt: string | null
  error: string | null
}

export function ScheduledView() {
  const [emails, setEmails] = useState<ScheduledEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/scheduled-emails")
    const d = await res.json()
    setEmails(d.emails ?? [])
    setLoading(false)
  }

  async function processDue() {
    setProcessing(true)
    const res = await fetch("/api/scheduled-emails/process", { method: "POST" })
    const d = await res.json()
    if (d.sent > 0) toast.success(`Sent ${d.sent} scheduled email${d.sent > 1 ? "s" : ""}`)
    await load()
    setProcessing(false)
  }

  async function cancel(id: string) {
    setCancelling(id)
    await fetch("/api/scheduled-emails", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setEmails((p) => p.filter((e) => e.id !== id))
    toast.success("Cancelled")
    setCancelling(null)
  }

  useEffect(() => { load().then(() => processDue()) }, [])

  const pending = emails.filter((e) => e.status === "pending")
  const sent = emails.filter((e) => e.status === "sent")
  const failed = emails.filter((e) => e.status === "failed")

  return (
    <div className="min-h-full bg-cream">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sand/15 flex items-center justify-center">
              <Clock className="w-5 h-5 text-sand" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-espresso tracking-tight">Scheduled Emails</h1>
              <p className="text-sm text-stone-warm">Emails queued to send automatically</p>
            </div>
          </div>
          <button onClick={() => load().then(() => processDue())} disabled={processing || loading}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-taupe text-xs text-stone-warm hover:border-stone-warm transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${processing || loading ? "animate-spin" : ""}`} />
            Check now
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl bg-taupe" />)}</div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-sand/10 flex items-center justify-center mb-4">
              <Clock className="w-7 h-7 text-sand" />
            </div>
            <p className="text-base font-semibold text-espresso">No scheduled emails</p>
            <p className="text-sm text-stone-warm mt-1">Use the compose window to schedule an email for later.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-warm px-1">Pending · {pending.length}</p>
                {pending.map((e) => <EmailRow key={e.id} email={e} onCancel={() => cancel(e.id)} cancelling={cancelling === e.id} />)}
              </div>
            )}
            {sent.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-warm px-1">Sent · {sent.length}</p>
                {sent.map((e) => <EmailRow key={e.id} email={e} />)}
              </div>
            )}
            {failed.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-warm px-1">Failed · {failed.length}</p>
                {failed.map((e) => <EmailRow key={e.id} email={e} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EmailRow({ email, onCancel, cancelling }: { email: ScheduledEmail; onCancel?: () => void; cancelling?: boolean }) {
  const isPending = email.status === "pending"
  const isSent = email.status === "sent"
  const isFailed = email.status === "failed"

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-taupe shadow-[0_1px_4px_rgba(45,42,38,0.06)]">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isPending ? "bg-sand/10" : isSent ? "bg-sage/10" : "bg-coral/10"}`}>
        {isPending && <Clock className="w-4 h-4 text-sand" />}
        {isSent && <CheckCircle2 className="w-4 h-4 text-sage" />}
        {isFailed && <XCircle className="w-4 h-4 text-coral" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-espresso truncate">{email.subject}</p>
        <p className="text-xs text-stone-warm">
          To: {email.to} ·{" "}
          {isSent ? `Sent ${format(new Date(email.sentAt!), "MMM d 'at' h:mm a")}` :
           isFailed ? `Failed: ${email.error}` :
           `Scheduled ${format(new Date(email.scheduledAt), "MMM d 'at' h:mm a")}`}
        </p>
      </div>
      {isPending && onCancel && (
        <button onClick={onCancel} disabled={cancelling}
          className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-taupe text-xs text-stone-warm hover:border-coral hover:text-coral transition-colors disabled:opacity-50">
          {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          Cancel
        </button>
      )}
    </div>
  )
}
