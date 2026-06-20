"use client"

import { useEffect, useRef, useState } from "react"
import { Thread, ThreadDetail, Email } from "@/types/email"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow, differenceInHours } from "date-fns"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AiDraftPanel } from "./ai-draft-panel"
import { FollowUpModal } from "./follow-up-modal"
import { ActionItemsPanel } from "./action-items-panel"
import { SmartReplyChips } from "./smart-reply-chips"
import { toast } from "sonner"
import {
  X, Star, Archive, Trash2, Bell, Sparkles, ChevronDown,
  ChevronUp, MoreHorizontal, Reply, Forward, CheckSquare, Calendar,
  ExternalLink, Clock, Crown, BellOff, Mail, MailOpen,
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

// Detect date-like phrases in email body
function detectMeeting(text: string): boolean {
  const patterns = [
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b\d{1,2}(am|pm|:\d{2})\b/i,
    /\b(today|tomorrow|next week|this week)\b/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}/i,
    /\bcall\b|\bmeeting\b|\bschedule\b|\bsync\b/i,
  ]
  return patterns.some((p) => p.test(text))
}

// Parse List-Unsubscribe header and return a URL or mailto
function parseUnsubscribeUrl(header: string): string | null {
  const httpMatch = header.match(/<(https?:\/\/[^>]+)>/)
  if (httpMatch) return httpMatch[1]
  const mailtoMatch = header.match(/<(mailto:[^>]+)>/)
  if (mailtoMatch) return mailtoMatch[1]
  return null
}

export function ThreadPanel({ threadId, onClose, onUpdate, userName, userEmail }: ThreadPanelProps) {
  const [thread, setThread] = useState<ThreadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set())
  const [draftOpen, setDraftOpen] = useState(false)
  const [prefillDraft, setPrefillDraft] = useState("")
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [actionItemsOpen, setActionItemsOpen] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [isVip, setIsVip] = useState(false)
  const [vipLoading, setVipLoading] = useState(false)

  const refetchThread = async () => {
    try {
      const data = await fetch(`/api/threads/${threadId}`).then((r) => r.json())
      setThread(data)
      if (data.emails?.length) {
        const lastId = data.emails[data.emails.length - 1].id
        setExpandedEmails((prev) => new Set([...prev, lastId]))
      }
    } catch {
      toast.error("Failed to load thread")
    }
  }

  useEffect(() => {
    setLoading(true)
    setActionItemsOpen(false)
    refetchThread().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId])

  // Check VIP status for the primary sender of this thread
  useEffect(() => {
    if (!thread) return
    const senderEmail = thread.emails?.[0]?.from
    if (!senderEmail) return
    fetch("/api/vip-contacts")
      .then((r) => r.json())
      .then((data) => {
        const emails = (data.contacts ?? []).map((c: { email: string }) => c.email.toLowerCase())
        setIsVip(emails.includes(senderEmail.toLowerCase()))
      })
      .catch(() => {})
  }, [thread])

  async function handleToggleVip() {
    if (!thread) return
    const senderEmail = thread.emails?.[0]?.from
    const senderName = thread.emails?.[0]?.fromName
    if (!senderEmail) return
    setVipLoading(true)
    try {
      if (isVip) {
        await fetch("/api/vip-contacts", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: senderEmail }),
        })
        setIsVip(false)
        toast.success("Removed from VIPs")
      } else {
        await fetch("/api/vip-contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: senderEmail, name: senderName }),
        })
        setIsVip(true)
        toast.success("Marked as VIP — emails will always go to Needs Attention")
      }
    } catch {
      toast.error("Failed to update VIP status")
    } finally {
      setVipLoading(false)
    }
  }

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

  async function handleCancelSnooze() {
    if (!thread) return
    onUpdate(threadId, { isSnoozed: false, snoozedUntil: null })
    await fetch(`/api/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSnoozed: false, snoozedUntil: null }),
    })
    toast.success("Snooze cancelled")
  }

  async function handleToggleRead() {
    if (!thread) return
    const next = !thread.isRead
    onUpdate(threadId, { isRead: next })
    await fetch(`/api/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: next }),
    })
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

  function openDraftWithPrefill(text: string) {
    setPrefillDraft(text)
    setDraftOpen(true)
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

  // Response time badge
  const hoursSinceLastMessage = differenceInHours(new Date(), new Date(thread.lastMessageAt))
  const showNoReplyBadge = thread.messageCount > 1 && hoursSinceLastMessage > 24

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-taupe shrink-0 bg-cream">
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleToggleVip}
                disabled={vipLoading}
              >
                <Crown className={cn("w-4 h-4", isVip && "fill-sand text-sand")} />
              </Button>
            } />
            <TooltipContent>{isVip ? "Remove VIP" : "Mark sender as VIP"}</TooltipContent>
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
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSummarize} disabled={summarizing}>
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

          <Tooltip>
            <TooltipTrigger render={
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", actionItemsOpen && "bg-blue-light text-slate-blue")}
                onClick={() => setActionItemsOpen((v) => !v)}
              >
                <CheckSquare className="w-4 h-4" />
              </Button>
            } />
            <TooltipContent>Action items</TooltipContent>
          </Tooltip>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-warm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            } />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleToggleRead}>
                {thread?.isRead
                  ? <><MailOpen className="w-3.5 h-3.5 mr-2" /> Mark as unread</>
                  : <><Mail className="w-3.5 h-3.5 mr-2" /> Mark as read</>}
              </DropdownMenuItem>
              {thread?.isSnoozed && (
                <DropdownMenuItem onClick={handleCancelSnooze}>
                  <BellOff className="w-3.5 h-3.5 mr-2" /> Cancel snooze
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDelete} className="text-coral">
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Move to trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Subject */}
      <div className="px-6 py-4 border-b border-taupe shrink-0 bg-cream">
        <h2 className="text-[22px] font-semibold text-espresso leading-tight tracking-tight mb-3">
          {thread.subject}
        </h2>
        {thread.aiSummary && (
          <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(45,42,38,0.06)] p-3 border-l-[3px] border-slate-blue">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-blue" />
              <span className="text-[11px] font-medium text-slate-blue tracking-wide bg-blue-light px-2 py-0.5 rounded">
                AI Summary
              </span>
            </div>
            <p className="text-sm text-stone-warm leading-relaxed">{thread.aiSummary}</p>
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center justify-end gap-2 mt-3">
          {showNoReplyBadge && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sand-light text-sand border border-sand/30 font-medium mr-auto">
              <Clock className="w-2.5 h-2.5" />
              No reply {Math.floor(hoursSinceLastMessage / 24)}d
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-taupe text-stone-warm hover:text-espresso">
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
        </div>
      </div>

      {/* Action items panel */}
      {actionItemsOpen && (
        <div className="border-b shrink-0">
          <ActionItemsPanel threadId={threadId} />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 bg-cream/40">
        {thread.emails.map((email, i) => {
          const isExpanded = expandedEmails.has(email.id)
          const isLast = i === thread.emails.length - 1
          return (
            <EmailBubble
              key={email.id}
              email={email}
              expanded={isExpanded}
              isLast={isLast}
              subject={thread.subject}
              onToggle={() => toggleEmail(email.id)}
              onReply={() => setDraftOpen(true)}
            />
          )
        })}

        {/* Smart reply chips below last email */}
        <SmartReplyChips
          threadId={threadId}
          onSelect={(text) => openDraftWithPrefill(text)}
        />
      </div>

      {/* Reply / Draft panel */}
      {draftOpen && (
        <AiDraftPanel
          threadId={threadId}
          thread={thread}
          userEmail={userEmail}
          onClose={() => { setDraftOpen(false); setPrefillDraft("") }}
          onSent={async () => {
            setDraftOpen(false)
            setPrefillDraft("")
            await refetchThread()
          }}
          prefillDraft={prefillDraft}
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
  subject,
  onToggle,
  onReply,
}: {
  email: Email
  expanded: boolean
  isLast: boolean
  subject: string
  onToggle: () => void
  onReply: () => void
}) {
  const senderDisplay = email.fromName ? `${email.fromName} <${email.from}>` : email.from
  const date = format(new Date(email.internalDate), "MMM d, yyyy 'at' h:mm a")

  const headers = (email.headers ?? {}) as Record<string, string>
  const unsubscribeHeader = headers["List-Unsubscribe"] ?? headers["list-unsubscribe"] ?? ""
  const unsubscribeUrl = unsubscribeHeader ? parseUnsubscribeUrl(unsubscribeHeader) : null

  const hasMeeting = expanded && detectMeeting(email.bodyText || email.snippet)
  const calendarUrl = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(subject)}`

  return (
    <div className={cn(
      "bg-white rounded-xl shadow-[0_1px_3px_rgba(45,42,38,0.06)] transition-shadow",
      isLast && "shadow-[0_4px_12px_rgba(45,42,38,0.08)]"
    )}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-cream/60 rounded-xl"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-full bg-sand flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-semibold">
              {(email.fromName ?? email.from).split(/[\s<]/)[0]?.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-espresso truncate">{email.fromName ?? email.from}</span>
              {!email.isRead && <span className="w-1.5 h-1.5 rounded-full bg-coral shrink-0" />}
            </div>
            {!expanded && (
              <p className="text-xs text-stone-warm truncate mt-0.5">{email.snippet}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-stone-warm">{date}</span>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-stone-warm" />
            : <ChevronDown className="w-4 h-4 text-stone-warm" />}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4">
          {email.to.length > 0 && (
            <p className="text-xs text-stone-warm mb-3">
              To: {email.to.join(", ")}
              {email.cc.length > 0 && <> · Cc: {email.cc.join(", ")}</>}
            </p>
          )}

          <div className="text-sm text-espresso leading-relaxed">
            {email.bodyHtml ? (
              <EmailBody html={email.bodyHtml} />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm">{email.bodyText || email.snippet}</pre>
            )}
          </div>

          {/* Attachments */}
          {Array.isArray(email.attachments) && email.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {email.attachments.map((att: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-taupe text-xs text-espresso">
                  <span className="font-medium">{att.filename}</span>
                  <span className="text-stone-warm">({Math.round(att.size / 1024)}KB)</span>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={onReply}
              className="h-9 px-4 rounded-[10px] bg-espresso text-white text-xs font-semibold flex items-center gap-2 hover:bg-espresso/85 transition-colors"
            >
              <Reply className="w-3.5 h-3.5" /> Reply with AI
            </button>
            <button className="h-9 px-3 rounded-[10px] border border-taupe text-stone-warm text-xs font-medium flex items-center gap-2 hover:border-stone-warm transition-colors">
              <Forward className="w-3.5 h-3.5" /> Forward
            </button>
            {hasMeeting && (
              <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                <button className="h-9 px-3 rounded-[10px] border border-taupe text-sage text-xs font-medium flex items-center gap-2 hover:border-sage transition-colors">
                  <Calendar className="w-3.5 h-3.5" /> Add to Calendar
                </button>
              </a>
            )}
            {unsubscribeUrl && (
              <a href={unsubscribeUrl} target="_blank" rel="noopener noreferrer">
                <button className="h-9 px-3 rounded-[10px] border border-taupe text-coral text-xs font-medium flex items-center gap-2 hover:border-coral transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Unsubscribe
                </button>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryDot({ category }: { category: string }) {
  const colors: Record<string, string> = {
    NEEDS_ATTENTION: "bg-coral",
    CAN_WAIT: "bg-sage",
    IGNORE: "bg-tan",
  }
  return <span className={cn("w-2 h-2 rounded-full shrink-0", colors[category] ?? "bg-tan")} />
}

function EmailBody({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(300)

  const srcDoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #2d2a26;
    word-break: break-word;
    overflow-wrap: break-word;
    overflow-x: hidden;
  }
  img { max-width: 100% !important; height: auto; }
  a { color: #6b7db3; }
  table { max-width: 100% !important; }
  pre { white-space: pre-wrap; }
</style>
</head>
<body>${html}</body>
</html>`

  function handleLoad() {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument?.body) return
    setHeight(iframe.contentDocument.body.scrollHeight + 24)
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      onLoad={handleLoad}
      className="w-full border-0 block"
      style={{ height }}
      sandbox="allow-same-origin allow-popups"
      title="Email content"
    />
  )
}
