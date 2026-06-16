"use client"

import { Thread } from "@/types/email"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { Star, Bell, Paperclip, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface EmailListProps {
  threads: Thread[]
  loading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onUpdate: (id: string, updates: Partial<Thread>) => void
  hasMore: boolean
  onLoadMore: () => void
}

export function EmailList({ threads, loading, selectedId, onSelect, onUpdate, hasMore, onLoadMore }: EmailListProps) {
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
      <div className="flex-1 overflow-y-auto divide-y">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12 ml-auto" />
            </div>
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (!threads.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground py-16">
        <p className="text-sm">No emails here</p>
        <p className="text-xs">Sync your inbox to get started</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y">
      {threads.map((thread) => (
        <ThreadRow
          key={thread.id}
          thread={thread}
          selected={selectedId === thread.id}
          onSelect={() => onSelect(thread.id)}
          onStar={(e) => toggleStar(e, thread)}
          onArchive={(e) => archiveThread(e, thread)}
        />
      ))}
      {hasMore && (
        <div className="p-4 flex justify-center">
          <Button variant="ghost" size="sm" onClick={onLoadMore}>
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
}: {
  thread: Thread
  selected: boolean
  onSelect: () => void
  onStar: (e: React.MouseEvent) => void
  onArchive: (e: React.MouseEvent) => void
}) {
  const senderName =
    thread.participantNames[0] || thread.participantEmails[0]?.split("@")[0] || "Unknown"
  const extraCount = thread.participantEmails.length - 1

  const timeAgo = formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })
    .replace("about ", "")
    .replace(" ago", "")

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
        selected ? "bg-primary/8" : "hover:bg-muted/50",
        !thread.isRead && "bg-primary/4"
      )}
    >
      {/* Unread dot */}
      {!thread.isRead && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
      )}

      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Row 1: Sender + time */}
        <div className="flex items-center gap-1">
          <span className={cn("text-sm truncate", !thread.isRead ? "font-semibold" : "font-medium")}>
            {senderName}
          </span>
          {extraCount > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
              <Users className="w-3 h-3" />
              {extraCount}
            </span>
          )}
          {thread.messageCount > 1 && (
            <span className="text-xs text-muted-foreground shrink-0">({thread.messageCount})</span>
          )}
          <span className="ml-auto text-xs text-muted-foreground shrink-0">{timeAgo}</span>
        </div>

        {/* Row 2: Subject */}
        <p className={cn("text-sm truncate", !thread.isRead ? "font-medium" : "text-foreground/80")}>
          {thread.subject}
        </p>

        {/* Row 3: Snippet + badges */}
        <div className="flex items-center gap-1">
          <p className="text-xs text-muted-foreground truncate flex-1">
            {thread.aiSummary || thread.snippet}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {thread.hasFollowUp && <Bell className="w-3 h-3 text-amber-500" />}
            {(thread._count?.emails ?? thread.messageCount) > 1 && (
              <Paperclip className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Labels */}
        {thread.labels.length > 0 && (
          <div className="flex gap-1 flex-wrap">
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

      {/* Hover actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={onStar}
          className={cn("p-1 rounded hover:bg-muted", thread.isStarred && "text-amber-500")}
        >
          <Star className="w-3.5 h-3.5" fill={thread.isStarred ? "currentColor" : "none"} />
        </button>
        <button onClick={onArchive} className="p-1 rounded hover:bg-muted text-muted-foreground text-xs font-medium">
          E
        </button>
      </div>
    </div>
  )
}
