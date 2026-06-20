"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Loader2, Trash2, RefreshCw, RotateCcw, ShieldOff } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface GmailThread {
  id: string
  snippet?: string
}

interface Props {
  title: string
  description: string
  icon: React.ReactNode
  apiRoute: "/api/trash" | "/api/spam"
  primaryAction: { label: string; icon: React.ReactNode; action: string }
  emptyMessage: string
}

export function GmailFolderView({ title, description, icon, apiRoute, primaryAction, emptyMessage }: Props) {
  const [threads, setThreads] = useState<GmailThread[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<Set<string>>(new Set())

  function load() {
    setLoading(true)
    fetch(apiRoute)
      .then((r) => r.json())
      .then((d) => setThreads(d.threads ?? []))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function runAction(threadId: string, action: string) {
    setWorking((p) => new Set([...p, threadId + action]))
    try {
      await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, action }),
      })
      setThreads((p) => p.filter((t) => t.id !== threadId))
      toast.success(action === "delete" ? "Permanently deleted" : action === "restore" ? "Restored to inbox" : "Moved to inbox")
    } catch {
      toast.error("Action failed")
    } finally {
      setWorking((p) => { const n = new Set(p); n.delete(threadId + action); return n })
    }
  }

  return (
    <div className="min-h-full bg-cream">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-warm/10 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-espresso tracking-tight">{title}</h1>
              <p className="text-sm text-stone-warm">{description}</p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-taupe text-xs text-stone-warm hover:border-stone-warm transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-stone-warm" />
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-taupe flex items-center justify-center mb-4 text-stone-warm">
              {icon}
            </div>
            <p className="text-sm font-medium text-espresso">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-warm px-1">
              {threads.length} thread{threads.length !== 1 ? "s" : ""}
            </p>
            {threads.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                primaryAction={primaryAction}
                working={working}
                onAction={(action) => runAction(thread.id, action)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ThreadRow({ thread, primaryAction, working, onAction }: {
  thread: GmailThread
  primaryAction: { label: string; icon: React.ReactNode; action: string }
  working: Set<string>
  onAction: (action: string) => void
}) {
  const isPrimaryWorking = working.has(thread.id + primaryAction.action)
  const isDeleteWorking = working.has(thread.id + "delete")

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-taupe shadow-[0_1px_4px_rgba(45,42,38,0.06)] hover:border-stone-warm/40 transition-colors">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-taupe flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-stone-warm">?</span>
      </div>

      {/* Snippet */}
      <p className="flex-1 text-sm text-stone-warm truncate min-w-0">
        {thread.snippet || "(no preview)"}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onAction(primaryAction.action)}
          disabled={isPrimaryWorking}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-espresso text-white text-xs font-medium hover:bg-espresso/85 transition-colors disabled:opacity-50"
        >
          {isPrimaryWorking ? <Loader2 className="w-3 h-3 animate-spin" /> : primaryAction.icon}
          {primaryAction.label}
        </button>
        <button
          onClick={() => onAction("delete")}
          disabled={isDeleteWorking}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-taupe text-stone-warm text-xs hover:border-coral hover:text-coral transition-colors disabled:opacity-50"
        >
          {isDeleteWorking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          Delete forever
        </button>
      </div>
    </div>
  )
}
