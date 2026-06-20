"use client"

import { useEffect, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Send, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SentEmail {
  id: string
  to: string
  subject: string
  snippet: string
  bodyText: string
  date: string
  threadId: string
}

interface EmailTrack {
  id: string
  toEmail: string
  subject: string
  openedAt: string | null
  openCount: number
  createdAt: string
}

type Tab = "sent" | "receipts"

export function SentView() {
  const [emails, setEmails] = useState<SentEmail[]>([])
  const [tracks, setTracks] = useState<EmailTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<SentEmail | null>(null)
  const [tab, setTab] = useState<Tab>("sent")

  useEffect(() => {
    Promise.all([
      fetch("/api/sent").then((r) => r.json()),
      fetch("/api/track").then((r) => r.json()),
    ]).then(([sentData, trackData]) => {
      setEmails(sentData.sent ?? [])
      setTracks(trackData.tracks ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex-1 p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-1.5 px-2 py-3 border-b">
            <div className="flex gap-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-16 ml-auto" />
            </div>
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden bg-cream">
      {/* List */}
      <div className={cn("flex flex-col border-r border-taupe overflow-y-auto", selected ? "w-96 shrink-0" : "flex-1")}>
        {/* Tabs */}
        <div className="flex border-b border-taupe shrink-0">
          <button onClick={() => setTab("sent")} className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors",
            tab === "sent" ? "text-espresso border-b-2 border-espresso" : "text-stone-warm hover:text-espresso"
          )}>
            <Send className="w-3.5 h-3.5" /> Sent ({emails.length})
          </button>
          <button onClick={() => setTab("receipts")} className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors",
            tab === "receipts" ? "text-espresso border-b-2 border-espresso" : "text-stone-warm hover:text-espresso"
          )}>
            <Eye className="w-3.5 h-3.5" /> Read Receipts ({tracks.length})
          </button>
        </div>

        {tab === "sent" ? (
          emails.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-stone-warm py-16">
              <Send className="w-8 h-8 opacity-30" />
              <p className="text-sm">No sent emails</p>
            </div>
          ) : (
            <div className="divide-y divide-taupe">
              {emails.map((email) => (
                <button key={email.id} onClick={() => setSelected((p) => p?.id === email.id ? null : email)}
                  className={cn("w-full text-left flex gap-3 px-4 py-3 transition-colors border-l-[3px] hover:bg-taupe/40",
                    selected?.id === email.id ? "bg-sand/10 border-sand" : "border-transparent")}>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-warm truncate flex-1">To: {email.to}</span>
                      <span className="text-xs text-stone-warm shrink-0">{format(new Date(email.date), "MMM d, h:mm a")}</span>
                    </div>
                    <p className="text-sm font-medium text-espresso truncate">{email.subject}</p>
                    <p className="text-xs text-stone-warm truncate">{email.snippet}</p>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          tracks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-stone-warm py-16">
              <Eye className="w-8 h-8 opacity-30" />
              <p className="text-sm">No tracked emails yet</p>
              <p className="text-xs text-stone-warm/60">Send a new email to start tracking</p>
            </div>
          ) : (
            <div className="divide-y divide-taupe">
              {tracks.map((t) => (
                <div key={t.id} className="px-4 py-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-warm truncate flex-1">To: {t.toEmail}</span>
                    <span className="text-xs text-stone-warm shrink-0">{format(new Date(t.createdAt), "MMM d")}</span>
                  </div>
                  <p className="text-sm font-medium text-espresso truncate">{t.subject}</p>
                  <div className="flex items-center gap-2">
                    {t.openCount > 0 ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-sage bg-sage/10 px-2 py-0.5 rounded-full">
                        <Eye className="w-3 h-3" />
                        Opened {t.openCount}× · {formatDistanceToNow(new Date(t.openedAt!), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-stone-warm bg-taupe/50 px-2 py-0.5 rounded-full">
                        <EyeOff className="w-3 h-3" />
                        Not opened
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Detail panel — only for sent tab */}
      {selected && tab === "sent" && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-espresso">{selected.subject}</h3>
            <p className="text-sm text-stone-warm mt-1">
              To: {selected.to} · {format(new Date(selected.date), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <div className="rounded-xl border border-taupe p-4 bg-white">
            <pre className="whitespace-pre-wrap font-sans text-sm text-espresso/80 leading-relaxed">
              {selected.bodyText || selected.snippet}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
