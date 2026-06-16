"use client"

import { useState } from "react"
import { ThreadDetail } from "@/types/email"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Sparkles, Send, X, RefreshCw, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AiDraftPanelProps {
  threadId: string
  thread: ThreadDetail
  userEmail: string
  onClose: () => void
}

export function AiDraftPanel({ threadId, thread, userEmail, onClose }: AiDraftPanelProps) {
  const lastEmail = thread.emails[thread.emails.length - 1]
  const replyTo = lastEmail?.from ?? ""

  const [to, setTo] = useState(replyTo === userEmail ? thread.emails[0]?.from ?? "" : replyTo)
  const [draft, setDraft] = useState("")
  const [instruction, setInstruction] = useState("")
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [improving, setImproving] = useState(false)

  async function generateDraft() {
    setGenerating(true)
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, instruction }),
      })
      const data = await res.json()
      setDraft(data.draft)
    } catch {
      toast.error("Failed to generate draft")
    } finally {
      setGenerating(false)
    }
  }

  async function improveDraft() {
    if (!draft || !instruction) return
    setImproving(true)
    try {
      const res = await fetch("/api/ai/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, instruction }),
      })
      const data = await res.json()
      setDraft(data.draft)
      setInstruction("")
    } catch {
      toast.error("Failed to improve draft")
    } finally {
      setImproving(false)
    }
  }

  async function sendEmail() {
    if (!draft.trim() || !to.trim()) return
    setSending(true)
    try {
      await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject: thread.subject.startsWith("Re:") ? thread.subject : `Re: ${thread.subject}`,
          html: `<p>${draft.replace(/\n/g, "<br>")}</p>`,
          replyToMessageId: lastEmail?.gmailMessageId,
          gmailThreadId: thread.gmailThreadId,
        }),
      })
      toast.success("Sent!")
      onClose()
    } catch {
      toast.error("Failed to send")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t bg-card shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">AI Draft</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* To field */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-4">To</span>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-7 text-sm"
            placeholder="recipient@example.com"
          />
        </div>

        {/* Instruction */}
        <div className="flex gap-2">
          <Input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            className="h-8 text-sm flex-1"
            placeholder="Instructions (e.g. 'be brief', 'ask for a call', 'decline politely')..."
            onKeyDown={(e) => { if (e.key === "Enter") draft ? improveDraft() : generateDraft() }}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 shrink-0"
            onClick={draft ? improveDraft : generateDraft}
            disabled={generating || improving}
          >
            {generating || improving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : draft ? (
              <><Wand2 className="w-3.5 h-3.5" /> Improve</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" /> Generate</>
            )}
          </Button>
        </div>

        {/* Draft textarea */}
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={generating ? "Generating..." : "Your reply will appear here..."}
          className={cn("min-h-[140px] text-sm resize-none", generating && "opacity-60")}
          disabled={generating}
        />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={generateDraft}
            disabled={generating}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", generating && "animate-spin")} />
            Regenerate
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={sendEmail}
            disabled={!draft.trim() || sending}
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  )
}
