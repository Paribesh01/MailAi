"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Thread, EmailCategory } from "@/types/email"
import { SplitTabs } from "./split-tabs"
import { EmailList } from "./email-list"
import { ThreadPanel } from "./thread-panel"
import { SearchBar } from "./search-bar"
import { ComposeModal } from "../compose/compose-modal"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Thread[] | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const isStarred = searchParams.get("starred") === "true"
  const isSnoozed = searchParams.get("snoozed") === "true"
  const isArchived = searchParams.get("archived") === "true"
  const isFollowups = searchParams.get("followups") === "true"
  const openCompose = searchParams.get("compose") === "true"

  useEffect(() => {
    if (openCompose) setComposeOpen(true)
  }, [openCompose])

  const fetchThreads = useCallback(async (p = 1) => {
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
    } catch {
      toast.error("Failed to load emails")
    } finally {
      setLoading(false)
    }
  }, [activeCategory, isStarred, isSnoozed, isArchived, isFollowups])

  useEffect(() => {
    setPage(1)
    setSelectedThread(null)
    fetchThreads(1)
  }, [fetchThreads])

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch("/api/sync", { method: "POST" })
      const data = await res.json()
      toast.success(`Synced ${data.synced} threads`)
      await fetchThreads(1)
    } catch {
      toast.error("Sync failed")
    } finally {
      setSyncing(false)
    }
  }

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

  const displayThreads = searchResults ?? threads

  const counts = threads.reduce(
    (acc, t) => { acc[t.category] = (acc[t.category] ?? 0) + 1; return acc },
    {} as Record<string, number>
  )

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left pane */}
      <div className={cn("flex flex-col border-r", selectedThread ? "w-96 shrink-0" : "flex-1")}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <SearchBar value={searchQuery} onChange={handleSearch} />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSync}
            disabled={syncing}
            className="shrink-0"
          >
            <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
          </Button>
        </div>

        {/* Split tabs — only show when not in a special view */}
        {!isStarred && !isSnoozed && !isArchived && !isFollowups && !searchQuery && (
          <SplitTabs
            active={activeCategory}
            onChange={(cat) => { setActiveCategory(cat); setPage(1) }}
            counts={counts}
          />
        )}

        {/* Email list */}
        <EmailList
          threads={displayThreads}
          loading={loading}
          selectedId={selectedThread}
          onSelect={setSelectedThread}
          onUpdate={updateThread}
          hasMore={hasMore}
          onLoadMore={() => { const next = page + 1; setPage(next); fetchThreads(next) }}
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
    </div>
  )
}
