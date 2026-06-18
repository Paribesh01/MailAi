"use client"

import { Thread } from "@/types/email"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { Star, Bell, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface EmailListProps {
  threads: Thread[]
  loading: boolean
  syncing: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onUpdate: (id: string, updates: Partial<Thread>) => void
  hasMore: boolean
  onLoadMore: () => void
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
}

export function EmailList({
  threads,
  loading,
  syncing,
  selectedId,
  onSelect,
  onUpdate,
  hasMore,
  onLoadMore,
  selectedIds = new Set(),
  onToggleSelect,
}: EmailListProps) {
  async function toggleStar(e: React.MouseEvent, thread: Thread) {
    e.stopPropagation()
    const next = !thread.isStarred
    onUpdate(thread.id, { isStarred: next })
    try {
      await fetch(`/api/threads/${thread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarred: next }),
      })
    } catch {
      onUpdate(thread.id, { isStarred: !next })
      toast.error("Failed to update")
    }
  }

  async function archiveThread(e: React.MouseEvent, thread: Thread) {
    e.stopPropagation()
    onUpdate(thread.id, { isArchived: true })
    try {
      await fetch(`/api/threads/${thread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      })
      toast.success("Archived")
    } catch {
      onUpdate(thread.id, { isArchived: false })
      toast.error("Failed to archive")
    }
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-[0_1px_3px_rgba(45,42,38,0.06)] p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-24 bg-taupe" />
              <Skeleton className="h-3 w-12 ml-auto bg-taupe" />
            </div>
            <Skeleton className="h-3 w-48 bg-taupe" />
            <Skeleton className="h-3 w-full bg-taupe" />
          </div>
        ))}
      </div>
    )
  }

  if (!threads.length) {
    if (syncing) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-stone-warm py-16">
          <RefreshCw className="w-6 h-6 animate-spin text-slate-blue/60" />
          <p className="text-sm font-medium text-espresso">Syncing your inbox…</p>
          <p className="text-xs">Fetching and categorising your emails with AI</p>
        </div>
      )
    }
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-stone-warm py-16">
        <svg className="w-12 h-12 text-tan mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        <p className="text-sm text-espresso">No emails here</p>
        <p className="text-xs">Hit the refresh button to sync your inbox</p>
      </div>
    )
  }

  const anySelected = selectedIds.size > 0

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
      {threads.map((thread) => (
        <ThreadRow
          key={thread.id}
          thread={thread}
          selected={selectedId === thread.id}
          onSelect={() => onSelect(thread.id)}
          onStar={(e) => toggleStar(e, thread)}
          onArchive={(e) => archiveThread(e, thread)}
          isChecked={selectedIds.has(thread.id)}
          onToggleSelect={onToggleSelect ? () => onToggleSelect(thread.id) : undefined}
          showCheckbox={anySelected}
        />
      ))}
      {hasMore && (
        <div className="py-4 flex justify-center">
          <Button variant="ghost" size="sm" onClick={onLoadMore} className="text-stone-warm">
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}

function ThreadRow({
  thread,
  selected,
  onSelect,
  onStar,
  onArchive,
  isChecked = false,
  onToggleSelect,
  showCheckbox = false,
}: {
  thread: Thread
  selected: boolean
  onSelect: () => void
  onStar: (e: React.MouseEvent) => void
  onArchive: (e: React.MouseEvent) => void
  isChecked?: boolean
  onToggleSelect?: () => void
  showCheckbox?: boolean
}) {
  const senderName =
    thread.participantNames[0] || thread.participantEmails[0]?.split("@")[0] || "Unknown"

  const timeAgo = formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })
    .replace("about ", "")
    .replace(" ago", "")

  const category = thread.category

  const borderColor =
    isChecked
      ? "#6b7db3"
      : category === "NEEDS_ATTENTION"
      ? "#e0745a"
      : category === "CAN_WAIT"
      ? "#7a9e7e"
      : "transparent"

  function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation()
    onToggleSelect?.()
  }

  return (
    <div
      onClick={onSelect}
      onMouseEnter={(e) => {
        if (!selected && !isChecked) {
          (e.currentTarget as HTMLElement).style.borderLeftColor = borderColor
        }
      }}
      onMouseLeave={(e) => {
        if (!selected && !isChecked) {
          (e.currentTarget as HTMLElement).style.borderLeftColor = "transparent"
        }
      }}
      className={cn(
        "group relative bg-white rounded-xl cursor-pointer transition-all duration-150 p-4",
        "shadow-[0_1px_3px_rgba(45,42,38,0.06)] hover:shadow-[0_4px_12px_rgba(45,42,38,0.1)]",
        category === "IGNORE" && !selected && "opacity-60"
      )}
      style={{
        borderLeft: `3px solid ${selected || isChecked ? borderColor : "transparent"}`,
      }}
    >
      <div className="flex gap-3">
        {/* Left column: unread dot + star */}
        <div className="w-7 flex flex-col items-center pt-0.5 gap-2 shrink-0">
          {!thread.isRead ? (
            <span className="w-1.5 h-1.5 rounded-full bg-coral shrink-0" />
          ) : (
            <span className="w-1.5 h-1.5 shrink-0" />
          )}
          <button
            onClick={onStar}
            className="cursor-pointer p-0.5 transition-colors"
          >
            <Star
              className={cn(
                "w-[17px] h-[17px] transition-colors",
                thread.isStarred
                  ? "text-sand fill-sand"
                  : "text-tan group-hover:text-sand/70"
              )}
            />
          </button>
        </div>

        {/* Right column: content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: sender + time */}
          <div className="flex items-center justify-between mb-1">
            <span className={cn(
              "text-[15px] truncate",
              !thread.isRead ? "font-semibold text-espresso" : "font-medium text-espresso"
            )}>
              {senderName}
              {thread.messageCount > 1 && (
                <span className="text-xs text-stone-warm font-normal ml-1.5">({thread.messageCount})</span>
              )}
            </span>
            <span className="text-xs font-medium text-stone-warm ml-2 shrink-0 tracking-wide">
              {timeAgo}
            </span>
          </div>

          {/* Row 2: subject */}
          <p className={cn(
            "text-sm truncate mb-1",
            !thread.isRead ? "font-semibold text-espresso" : "text-espresso/80"
          )}>
            {thread.subject}
          </p>

          {/* Row 3: AI summary */}
          <div className="flex items-start gap-1.5">
            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 bg-blue-light text-slate-blue text-[11px] font-medium tracking-wide rounded">
              AI
            </span>
            <p className="text-sm text-stone-warm truncate leading-relaxed">
              {thread.aiSummary || thread.snippet}
            </p>
          </div>

          {/* Labels */}
          {thread.labels.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1.5">
              {thread.labels.slice(0, 3).map(({ label }) => (
                <span
                  key={label.id}
                  className="inline-block h-4 px-1.5 rounded text-[10px] font-medium"
                  style={{ backgroundColor: label.color + "22", color: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover actions: archive + follow-up */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {thread.hasFollowUp && <Bell className="w-3.5 h-3.5 text-sand" />}
        <button
          onClick={onArchive}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-taupe/60 text-stone-warm text-xs font-medium hover:bg-taupe transition-colors"
          title="Archive"
        >
          E
        </button>
      </div>

      {/* Bulk select checkbox */}
      {onToggleSelect && (
        <div
          className={cn(
            "absolute top-3 left-3 z-10 transition-opacity",
            showCheckbox || isChecked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          onClick={handleCheckboxClick}
        >
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => {}}
            className="w-3.5 h-3.5 rounded cursor-pointer accent-slate-blue"
          />
        </div>
      )}
    </div>
  )
}
