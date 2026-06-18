"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Thread, EmailCategory } from "@/types/email"
import { SplitTabs } from "./split-tabs"
import { EmailList } from "./email-list"
import { ThreadPanel } from "./thread-panel"
import { SearchBar } from "./search-bar"
import { ComposeModal } from "../compose/compose-modal"
import { BulkActionBar } from "@/components/inbox/bulk-action-bar"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { ChatAssistant } from "./chat-assistant"

interface InboxViewProps {
  userName: string
  userEmail: string
}

export function InboxView({ userName, userEmail }: InboxViewProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<EmailCategory | "ALL">("NEEDS_ATTENTION")
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [newEmailsBanner, setNewEmailsBanner] = useState(false)
  const hasAutoSynced = useRef(false)
  const isPolling = useRef(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Thread[] | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const isStarred = searchParams.get("starred") === "true"
  const isSnoozed = searchParams.get("snoozed") === "true"
  const isArchived = searchParams.get("archived") === "true"
  const isFollowups = searchParams.get("followups") === "true"
  const openCompose = searchParams.get("compose") === "true"

  useEffect(() => {
    if (openCompose) setComposeOpen(true)
  }, [openCompose])

  const fetchThreads = useCallback(async (p = 1): Promise<number> => {
    setLoading(p === 1)
    try {
      const params = new URLSearchParams()
      if (!isStarred && !isSnoozed && !isArchived && !isFollowups && activeCategory !== "ALL") {
        params.set("category", activeCategory)
      }
      if (isStarred) params.set("starred", "true")
      if (isSnoozed) params.set("snoozed", "true")
      if (isArchived) params.set("archived", "true")
      params.set("page", String(p))
      params.set("limit", "30")

      const res = await fetch(`/api/emails?${params}`)
      const data = await res.json()

      let result = data.threads as Thread[]
      if (isFollowups) result = result.filter((t) => t.hasFollowUp)

      if (p === 1) setThreads(result)
      else setThreads((prev) => [...prev, ...result])
      setHasMore(p < data.pages)
      return result.length
    } catch {
      toast.error("Failed to load emails")
      return 0
    } finally {
      setLoading(false)
    }
  }, [activeCategory, isStarred, isSnoozed, isArchived, isFollowups])

  const handleSync = useCallback(async () => {
    setSyncing(true)
    setNewEmailsBanner(false)
    try {
      const res = await fetch("/api/sync", { method: "POST" })
      const data = await res.json()
      if (data.newThreads > 0) toast.success(`${data.newThreads} new email${data.newThreads > 1 ? "s" : ""}`)
      await fetchThreads(1)
    } catch {
      toast.error("Sync failed")
    } finally {
      setSyncing(false)
    }
  }, [fetchThreads])

  useEffect(() => {
    setPage(1)
    setSelectedThread(null)
    fetchThreads(1).then((count) => {
      if (count === 0 && !hasAutoSynced.current) {
        hasAutoSynced.current = true
        handleSync()
      }
    })
  }, [fetchThreads, handleSync])

  // Background poll every 60 s — silent, only notifies on genuinely new threads
  useEffect(() => {
    const poll = async () => {
      if (isPolling.current || syncing) return
      isPolling.current = true
      try {
        const res = await fetch("/api/sync", { method: "POST" })
        const data = await res.json()
        if (data.newThreads > 0) {
          setNewEmailsBanner(true)
        }
      } catch {
        // silent — don't bother the user if background poll fails
      } finally {
        isPolling.current = false
      }
    }

    const id = setInterval(poll, 60_000)
    return () => clearInterval(id)
  }, [syncing])

  async function handleSearch(q: string) {
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults(null); return }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data.threads)
    } catch {
      toast.error("Search failed")
    }
  }

  function updateThread(id: string, updates: Partial<Thread>) {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }

  async function handleArchiveThread(id: string) {
    updateThread(id, { isArchived: true })
    try {
      await fetch(`/api/threads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      })
      toast.success("Archived")
    } catch {
      updateThread(id, { isArchived: false })
      toast.error("Failed to archive")
    }
  }

  async function handleStarThread(id: string) {
    const thread = threads.find((t) => t.id === id)
    if (!thread) return
    const next = !thread.isStarred
    updateThread(id, { isStarred: next })
    try {
      await fetch(`/api/threads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarred: next }),
      })
    } catch {
      updateThread(id, { isStarred: !next })
      toast.error("Failed to update")
    }
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const displayThreads = searchResults ?? threads

  useKeyboardShortcuts({
    threads: displayThreads,
    selectedThread,
    onSelectThread: setSelectedThread,
    onArchive: handleArchiveThread,
    onStar: handleStarThread,
    onCompose: () => setComposeOpen(true),
    onSearch: () => {
      const input = document.querySelector<HTMLInputElement>("input[placeholder='Search emails...']")
      input?.focus()
    },
  })

  const counts = threads.reduce(
    (acc, t) => { acc[t.category] = (acc[t.category] ?? 0) + 1; return acc },
    {} as Record<string, number>
  )

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left pane */}
      <div className={cn("flex flex-col border-r", selectedThread ? "w-96 shrink-0" : "flex-1")}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-taupe bg-cream">
          <SearchBar value={searchQuery} onChange={handleSearch} />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSync}
            disabled={syncing}
            className="shrink-0 text-stone-warm hover:text-espresso hover:bg-sand-light/50"
          >
            <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
          </Button>
        </div>

        {/* New emails banner */}
        {newEmailsBanner && (
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-light text-slate-blue text-xs font-medium hover:bg-blue-light/70 transition-colors border-b border-taupe"
            onClick={() => { setNewEmailsBanner(false); fetchThreads(1) }}
          >
            <RefreshCw className="w-3 h-3" />
            New emails arrived — click to refresh
          </button>
        )}

        {/* Split tabs — only show when not in a special view */}
        {!isStarred && !isSnoozed && !isArchived && !isFollowups && !searchQuery && (
          <SplitTabs
            active={activeCategory}
            onChange={(cat) => { setActiveCategory(cat); setPage(1) }}
            counts={counts}
          />
        )}

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="px-3 py-2 border-b">
            <BulkActionBar
              selectedIds={selectedIds}
              onClear={() => setSelectedIds(new Set())}
              onUpdate={updateThread}
            />
          </div>
        )}

        {/* Email list */}
        <EmailList
          threads={displayThreads}
          loading={loading}
          syncing={syncing}
          selectedId={selectedThread}
          onSelect={setSelectedThread}
          onUpdate={updateThread}
          hasMore={hasMore}
          onLoadMore={() => { const next = page + 1; setPage(next); fetchThreads(next) }}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
        />
      </div>

      {/* Thread panel */}
      {selectedThread && (
        <div className="flex-1 overflow-hidden">
          <ThreadPanel
            threadId={selectedThread}
            onClose={() => setSelectedThread(null)}
            onUpdate={updateThread}
            userName={userName}
            userEmail={userEmail}
          />
        </div>
      )}

      <ComposeModal
        open={composeOpen}
        onClose={() => { setComposeOpen(false); router.replace("/inbox") }}
        userEmail={userEmail}
      />

      <ChatAssistant />
    </div>
  )
}
