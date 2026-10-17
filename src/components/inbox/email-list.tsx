"use client"

import { Thread } from "@/types/email"
import { cn } from "@/lib/utils"
import { formatListDate } from "@/lib/format-date"
import { format } from "date-fns"
import { Star, Bell, RefreshCw, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface EmailListProps {
  threads: Thread[]
  loading: boolean
  syncing: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onStar: (id: string) => void
  onArchive: (id: string) => void
  hasMore: boolean
  loadingMore?: boolean
  onLoadMore: () => void
  emptyMessage?: string
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
}

// Literal class names so Tailwind can see them
const CATEGORY_ACCENT: Record<string, string> = {
  NEEDS_ATTENTION: "border-l-coral",
  CAN_WAIT: "border-l-sage",
  IGNORE: "border-l-tan",
}
const CATEGORY_HOVER_ACCENT: Record<string, string> = {
  NEEDS_ATTENTION: "hover:border-l-coral",
  CAN_WAIT: "hover:border-l-sage",
  IGNORE: "hover:border-l-tan",
}

export function EmailList({
  threads,
  loading,
  syncing,
  selectedId,
  onSelect,
  onStar,
  onArchive,
  hasMore,
  loadingMore = false,
  onLoadMore,
  emptyMessage,
  selectedIds,
  onToggleSelect,
}: EmailListProps) {
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
        <p className="text-sm text-espresso">{emptyMessage ?? "No emails here"}</p>
        <p className="text-xs">Hit the refresh button to sync your inbox</p>
      </div>
    )
  }

  const anySelected = (selectedIds?.size ?? 0) > 0

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2" role="list">
      {threads.map((thread) => (
        <ThreadRow
          key={thread.id}
          thread={thread}
          selected={selectedId === thread.id}
          onSelect={() => onSelect(thread.id)}
          onStar={() => onStar(thread.id)}
          onArchive={() => onArchive(thread.id)}
          isChecked={selectedIds?.has(thread.id) ?? false}
          onToggleSelect={onToggleSelect ? () => onToggleSelect(thread.id) : undefined}
          showCheckbox={anySelected}
        />
      ))}
      {hasMore && (
        <div className="py-4 flex justify-center">
          <Button variant="ghost" size="sm" onClick={onLoadMore} disabled={loadingMore} className="text-stone-warm">
            {loadingMore && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {loadingMore ? "Loading…" : "Load more"}
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
  onStar: () => void
  onArchive: () => void
  isChecked?: boolean
  onToggleSelect?: () => void
  showCheckbox?: boolean
}) {
  const senderName =
    thread.participantNames[0] || thread.participantEmails[0]?.split("@")[0] || "Unknown"
  const preview = thread.aiSummary || thread.snippet
  const checkboxVisible = showCheckbox || isChecked

  function stop(handler: () => void) {
    return (e: React.MouseEvent) => {
      e.stopPropagation()
      handler()
    }
  }

  return (
    <div
      role="listitem"
      tabIndex={0}
      aria-current={selected || undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "group relative rounded-xl cursor-pointer transition-all duration-150 p-4 border-l-[3px]",
        "shadow-[0_1px_3px_rgba(45,42,38,0.06)] hover:shadow-[0_4px_12px_rgba(45,42,38,0.1)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-blue/40",
        selected ? "bg-sand-light/40" : isChecked ? "bg-blue-light/40" : "bg-white",
        isChecked
          ? "border-l-slate-blue"
          : selected
          ? CATEGORY_ACCENT[thread.category]
          : cn("border-l-transparent", CATEGORY_HOVER_ACCENT[thread.category]),
        thread.category === "IGNORE" && !selected && !isChecked && "opacity-60 hover:opacity-100"
      )}
    >
      <div className="flex gap-3">
        {/* Left column: unread dot / bulk checkbox + star */}
        <div className="w-7 flex flex-col items-center pt-0.5 gap-2 shrink-0">
          <div className="h-4 flex items-center justify-center">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={isChecked}
                onChange={onToggleSelect}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select email from ${senderName}`}
                className={cn(
                  "w-3.5 h-3.5 rounded cursor-pointer accent-slate-blue",
                  checkboxVisible ? "block" : "hidden group-hover:block group-focus-within:block"
                )}
              />
            )}
            {!thread.isRead && (
              <span
                aria-label="Unread"
                className={cn(
                  "w-2 h-2 rounded-full bg-coral",
                  onToggleSelect && (checkboxVisible ? "hidden" : "group-hover:hidden group-focus-within:hidden")
                )}
              />
            )}
          </div>
          <button
            onClick={stop(onStar)}
            aria-label={thread.isStarred ? "Unstar" : "Star"}
            className="cursor-pointer p-0.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand/50"
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
          <div className="flex items-center justify-between mb-1 gap-2">
            <span className={cn(
              "text-[15px] truncate text-espresso",
              !thread.isRead ? "font-semibold" : "font-medium"
            )}>
              {senderName}
              {thread.messageCount > 1 && (
                <span className="text-xs text-stone-warm font-normal ml-1.5">({thread.messageCount})</span>
              )}
            </span>
            <span className="flex items-center gap-1.5 shrink-0 group-hover:invisible group-focus-within:invisible">
              {thread.hasFollowUp && <Bell className="w-3.5 h-3.5 text-sand" aria-label="Follow-up scheduled" />}
              <time
                dateTime={thread.lastMessageAt}
                title={format(new Date(thread.lastMessageAt), "PPpp")}
                className={cn("text-xs tracking-wide", !thread.isRead ? "font-semibold text-espresso" : "font-medium text-stone-warm")}
              >
                {formatListDate(thread.lastMessageAt)}
              </time>
            </span>
          </div>

          {/* Row 2: subject */}
          <p className={cn(
            "text-sm truncate mb-1",
            !thread.isRead ? "font-semibold text-espresso" : "text-espresso/80"
          )}>
            {thread.subject || "(no subject)"}
          </p>

          {/* Row 3: AI summary, falling back to the plain snippet */}
          {preview && (
            <div className="flex items-start gap-1.5">
              {thread.aiSummary && (
                <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 bg-blue-light text-slate-blue text-[11px] font-medium tracking-wide rounded">
                  AI
                </span>
              )}
              <p className="text-sm text-stone-warm truncate leading-relaxed">{preview}</p>
            </div>
          )}

          {/* Account badge — only shown for linked accounts */}
          {thread.accountEmail && (
            <div className="flex items-center gap-1 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-blue shrink-0" />
              <span className="text-[11px] text-slate-blue font-medium truncate">
                {thread.accountEmail}
              </span>
            </div>
          )}

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
              {thread.labels.length > 3 && (
                <span className="text-[10px] text-stone-warm">+{thread.labels.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        {!thread.isArchived && (
          <button
            onClick={stop(onArchive)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-taupe/60 text-stone-warm hover:bg-taupe hover:text-espresso transition-colors"
            title="Archive (E)"
            aria-label="Archive"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
