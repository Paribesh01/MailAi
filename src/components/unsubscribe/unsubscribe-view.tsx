"use client"

import { useEffect, useState } from "react"
import { MailX, Loader2, CheckCircle2, ExternalLink, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface Sender {
  email: string
  name: string
  count: number
  unsubscribeMailto: string | null
  unsubscribeUrl: string | null
}

export function UnsubscribeView() {
  const [senders, setSenders] = useState<Sender[]>([])
  const [loading, setLoading] = useState(true)
  const [unsubscribed, setUnsubscribed] = useState<Set<string>>(new Set())
  const [working, setWorking] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch("/api/unsubscribe")
      .then((r) => r.json())
      .then((d) => setSenders(d.senders ?? []))
      .catch(() => toast.error("Failed to load senders"))
      .finally(() => setLoading(false))
  }, [])

  async function handleUnsubscribe(sender: Sender) {
    setWorking((prev) => new Set([...prev, sender.email]))
    try {
      if (sender.unsubscribeUrl && !sender.unsubscribeMailto) {
        // Open the URL in a new tab — can't do this server-side
        window.open(sender.unsubscribeUrl, "_blank", "noopener,noreferrer")
      }

      await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderEmail: sender.email,
          unsubscribeMailto: sender.unsubscribeMailto,
        }),
      })

      setUnsubscribed((prev) => new Set([...prev, sender.email]))
      toast.success(`Unsubscribed from ${sender.name}`)
    } catch {
      toast.error("Unsubscribe failed")
    } finally {
      setWorking((prev) => {
        const next = new Set(prev)
        next.delete(sender.email)
        return next
      })
    }
  }

  const active = senders.filter((s) => !unsubscribed.has(s.email))
  const done = senders.filter((s) => unsubscribed.has(s.email))

  return (
    <div className="min-h-full bg-cream overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center">
            <MailX className="w-5 h-5 text-coral" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-espresso tracking-tight">Unsubscribe Manager</h1>
            <p className="text-sm text-stone-warm">Newsletter senders from your Ignore category</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl bg-taupe" />
            ))}
          </div>
        ) : senders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-sage/10 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-sage" />
            </div>
            <p className="text-base font-semibold text-espresso">All clear!</p>
            <p className="text-sm text-stone-warm mt-1 max-w-xs">
              No newsletter senders found in your Ignore category. Sync your inbox first if you just signed up.
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Senders", value: senders.length },
                { label: "Unsubscribed", value: unsubscribed.size },
                { label: "Remaining", value: active.length },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-white border border-taupe p-4 text-center shadow-[0_1px_4px_rgba(45,42,38,0.06)]">
                  <p className="text-2xl font-bold text-espresso">{value}</p>
                  <p className="text-xs text-stone-warm mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Active senders */}
            {active.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-warm px-1">
                  {active.length} sender{active.length !== 1 ? "s" : ""} to clean up
                </p>
                {active.map((sender) => (
                  <SenderRow
                    key={sender.email}
                    sender={sender}
                    working={working.has(sender.email)}
                    onUnsubscribe={() => handleUnsubscribe(sender)}
                  />
                ))}
              </div>
            )}

            {/* Done senders */}
            {done.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-warm px-1">
                  Done
                </p>
                {done.map((sender) => (
                  <div
                    key={sender.email}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sage-light border border-sage/20"
                  >
                    <CheckCircle2 className="w-4 h-4 text-sage shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-espresso truncate">{sender.name}</p>
                      <p className="text-xs text-stone-warm truncate">{sender.email}</p>
                    </div>
                    <span className="text-xs text-sage font-medium">Unsubscribed</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SenderRow({
  sender,
  working,
  onUnsubscribe,
}: {
  sender: Sender
  working: boolean
  onUnsubscribe: () => void
}) {
  const hasUnsubscribe = sender.unsubscribeMailto || sender.unsubscribeUrl
  const isUrlOnly = !sender.unsubscribeMailto && !!sender.unsubscribeUrl

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-taupe shadow-[0_1px_4px_rgba(45,42,38,0.06)] hover:border-tan transition-colors">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-coral/10 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-coral">
          {(sender.name[0] ?? sender.email[0]).toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-espresso truncate">{sender.name}</p>
        <p className="text-xs text-stone-warm truncate">{sender.email}</p>
      </div>

      {/* Count badge */}
      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-taupe text-stone-warm shrink-0">
        {sender.count} email{sender.count !== 1 ? "s" : ""}
      </span>

      {/* Action */}
      {hasUnsubscribe ? (
        <button
          onClick={onUnsubscribe}
          disabled={working}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-coral text-white text-xs font-semibold hover:bg-coral/85 transition-colors disabled:opacity-50 shrink-0"
        >
          {working ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isUrlOnly ? (
            <ExternalLink className="w-3 h-3" />
          ) : (
            <MailX className="w-3 h-3" />
          )}
          {working ? "Sending…" : isUrlOnly ? "Open page" : "Unsubscribe"}
        </button>
      ) : (
        <span className="text-[11px] text-stone-warm/50 shrink-0">No link found</span>
      )}
    </div>
  )
}
