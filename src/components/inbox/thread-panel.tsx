"use client"

import { useEffect, useState } from "react"
import { Thread, ThreadDetail, Email } from "@/types/email"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AiDraftPanel } from "./ai-draft-panel"
import { FollowUpModal } from "./follow-up-modal"
import { toast } from "sonner"
import {
  X, Star, Archive, Trash2, Bell, Sparkles, ChevronDown,
  ChevronUp, MoreHorizontal, Reply, Forward, Clock,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ThreadPanelProps {
  threadId: string
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Thread>) => void
  userName: string
  userEmail: string
}

export function ThreadPanel({ threadId, onClose, onUpdate, userName, userEmail }: ThreadPanelProps) {
  const [thread, setThread] = useState<ThreadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set())
  const [draftOpen, setDraftOpen] = useState(false)
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [summarizing, setSummarizing] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/threads/${threadId}`)
      .then((r) => r.json())
      .then((data) => {
        setThread(data)
        // Auto-expand last email
        if (data.emails?.length) {
          setExpandedEmails(new Set([data.emails[data.emails.length - 1].id]))
        }
      })
      .catch(() => toast.error("Failed to load thread"))
      .finally(() => setLoading(false))
  }, [threadId])

  async function handleStar() {
    if (!thread) return
    const next = !thread.isStarred
    setThread((t) => t && { ...t, isStarred: next })
    onUpdate(threadId, { isStarred: next })
    await fetch(`/api/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isStarred: next }),
    })
  }

  async function handleArchive() {
    if (!thread) return
    onUpdate(threadId, { isArchived: true })
    await fetch(`/api/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: true }),
    })
    toast.success("Archived")
    onClose()
  }

  async function handleDelete() {
    if (!confirm("Move to trash?")) return
    await fetch(`/api/threads/${threadId}`, { method: "DELETE" })
    toast.success("Moved to trash")
    onClose()
  }

  async function handleCategoryChange(category: string) {
    if (!thread) return
    setThread((t) => t && { ...t, category: category as any })
    onUpdate(threadId, { category: category as any })
    await fetch(`/api/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    })
    toast.success(`Moved to "${category.replace("_", " ").toLowerCase()}"`)
  }

  async function handleSummarize() {
    setSummarizing(true)
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId }),
      })
      const data = await res.json()
      setThread((t) => t && { ...t, aiSummary: data.summary })
      onUpdate(threadId, { aiSummary: data.summary })
    } catch {
      toast.error("Summarize failed")
    } finally {
      setSummarizing(false)
    }
  }

  function toggleEmail(id: string) {
    setExpandedEmails((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col p-6 gap-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-3 mt-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    )
  }

  if (!thread) return null

  const CATEGORIES = [
    { value: "NEEDS_ATTENTION", label: "Needs attention" },
    { value: "CAN_WAIT", label: "Can wait" },
    { value: "IGNORE", label: "Ignore" },
  ]

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b shrink-0">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1 ml-1">
          <Tooltip>
            <TooltipTrigger render={
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleStar}>
                <Star className={cn("w-4 h-4", thread.isStarred && "fill-amber-500 text-amber-500")} />
              </Button>
            } />
            <TooltipContent>{thread.isStarred ? "Unstar" : "Star"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleArchive}>
                <Archive className="w-4 h-4" />
              </Button>
            } />
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFollowUpOpen(true)}>
                <Bell className={cn("w-4 h-4", thread.hasFollowUp && "text-amber-500")} />
              </Button>
            } />
            <TooltipContent>Set follow-up</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleSummarize}
                disabled={summarizing}
              >
                <Sparkles className={cn("w-4 h-4", summarizing && "animate-pulse text-primary")} />
              </Button>
            } />
            <TooltipContent>AI summarize</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDraftOpen(true)}>
                <Reply className="w-4 h-4" />
              </Button>
            } />
            <TooltipContent>AI draft reply</TooltipContent>
          </Tooltip>
        </div>

        {/* Category badge */}
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <CategoryDot category={thread.category} />
                {CATEGORIES.find((c) => c.value === thread.category)?.label ?? thread.category}
              </Button>
            } />
            <DropdownMenuContent align="end">
              {CATEGORIES.map((c) => (
                <DropdownMenuItem key={c.value} onClick={() => handleCategoryChange(c.value)}>
                  <CategoryDot category={c.value as any} />
                  {c.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            } />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Move to trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Subject */}
      <div className="px-6 py-4 border-b shrink-0">
        <h2 className="text-lg font-semibold leading-tight">{thread.subject}</h2>
        {thread.aiSummary && (
          <p className="mt-2 text-sm text-muted-foreground bg-primary/5 rounded-lg px-3 py-2 border border-primary/10">
            <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
            {thread.aiSummary}
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {thread.emails.map((email, i) => {
          const isExpanded = expandedEmails.has(email.id)
          const isLast = i === thread.emails.length - 1
          return (
            <EmailBubble
              key={email.id}
              email={email}
              expanded={isExpanded}
              isLast={isLast}
              onToggle={() => toggleEmail(email.id)}
              onReply={() => setDraftOpen(true)}
            />
          )
        })}
      </div>

      {/* Reply / Draft panel */}
      {draftOpen && (
        <AiDraftPanel
          threadId={threadId}
          thread={thread}
          userEmail={userEmail}
          onClose={() => setDraftOpen(false)}
        />
      )}

      <FollowUpModal
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        threadId={threadId}
        onScheduled={() => {
          setThread((t) => t && { ...t, hasFollowUp: true })
          onUpdate(threadId, { hasFollowUp: true })
        }}
      />
    </div>
  )
}

function EmailBubble({
  email,
  expanded,
  isLast,
  onToggle,
  onReply,
}: {
  email: Email
  expanded: boolean
  isLast: boolean
  onToggle: () => void
  onReply: () => void
}) {
  const senderDisplay = email.fromName ? `${email.fromName} <${email.from}>` : email.from
  const date = format(new Date(email.internalDate), "MMM d, yyyy 'at' h:mm a")

  return (
    <div className={cn("rounded-xl border", isLast && "shadow-sm")}>
      {/* Header — always visible */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 rounded-xl"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{senderDisplay}</span>
            {!email.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
          </div>
          {!expanded && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{email.snippet}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{date}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* To/Cc */}
          {email.to.length > 0 && (
            <p className="text-xs text-muted-foreground mb-3">
              To: {email.to.join(", ")}
              {email.cc.length > 0 && <> · Cc: {email.cc.join(", ")}</>}
            </p>
          )}

          {/* Body */}
          <div className="text-sm">
            {email.bodyHtml ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm">{email.bodyText || email.snippet}</pre>
            )}
          </div>

          {/* Attachments */}
          {Array.isArray(email.attachments) && email.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {email.attachments.map((att: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs">
                  <span className="font-medium">{att.filename}</span>
                  <span className="text-muted-foreground">({Math.round(att.size / 1024)}KB)</span>
                </div>
              ))}
            </div>
          )}

          {/* Reply button */}
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onReply}>
              <Reply className="w-3.5 h-3.5" /> Reply with AI
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5">
              <Forward className="w-3.5 h-3.5" /> Forward
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryDot({ category }: { category: string }) {
  const colors: Record<string, string> = {
    NEEDS_ATTENTION: "bg-red-500",
    CAN_WAIT: "bg-amber-500",
    IGNORE: "bg-slate-400",
  }
  return <span className={cn("w-2 h-2 rounded-full shrink-0", colors[category] ?? "bg-slate-400")} />
}
