"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Send } from "lucide-react"
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

export function SentView() {
  const [emails, setEmails] = useState<SentEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<SentEmail | null>(null)

  useEffect(() => {
    fetch("/api/sent")
      .then((r) => r.json())
      .then((data) => setEmails(data.sent ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
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

  if (!emails.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground py-16">
        <Send className="w-8 h-8 opacity-30" />
        <p className="text-sm">No sent emails</p>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* List */}
      <div className={cn("flex flex-col border-r overflow-y-auto", selected ? "w-96 shrink-0" : "flex-1")}>
        <div className="px-4 py-3 border-b bg-gradient-to-r from-sky-500/5 via-indigo-500/5 to-transparent">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-sky-400" />
            Sent
            <span className="ml-auto text-xs text-muted-foreground font-normal">{emails.length} emails</span>
          </h2>
        </div>
        <div className="divide-y">
          {emails.map((email) => (
            <button
              key={email.id}
              onClick={() => setSelected((prev) => prev?.id === email.id ? null : email)}
              className={cn(
                "w-full text-left flex gap-3 px-4 py-3 transition-colors border-l-[3px] hover:bg-muted/40",
                selected?.id === email.id
                  ? "bg-sky-500/10 border-sky-500"
                  : "border-transparent"
              )}
            >
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground truncate flex-1">To: {email.to}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(email.date), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-sm font-medium truncate">{email.subject}</p>
                <p className="text-xs text-muted-foreground truncate">{email.snippet}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">{selected.subject}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              To: {selected.to} · {format(new Date(selected.date), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <div className="rounded-xl border p-4 bg-card">
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/80 leading-relaxed">
              {selected.bodyText || selected.snippet}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
