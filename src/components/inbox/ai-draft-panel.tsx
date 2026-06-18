"use client"

import { useState, useEffect, useRef } from "react"
import { ThreadDetail } from "@/types/email"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Sparkles, Send, X, RefreshCw, Wand2, ChevronDown, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { SmartReplyChips } from "@/components/inbox/smart-reply-chips"

type Tone = "Friendly" | "Formal" | "Brief" | "Assertive"

const TONE_OPTIONS: Tone[] = ["Friendly", "Formal", "Brief", "Assertive"]

interface Template {
  id: string
  name: string
  body: string
}

interface AiDraftPanelProps {
  threadId: string
  thread: ThreadDetail
  userEmail: string
  onClose: () => void
  onSent?: () => void
  prefillDraft?: string
}

export function AiDraftPanel({ threadId, thread, userEmail, onClose, onSent, prefillDraft = "" }: AiDraftPanelProps) {
  const lastEmail = thread.emails[thread.emails.length - 1]
  const replyTo = lastEmail?.from ?? ""

  const [to, setTo] = useState(replyTo === userEmail ? thread.emails[0]?.from ?? "" : replyTo)
  const [draft, setDraft] = useState(prefillDraft)
  const [instruction, setInstruction] = useState("")
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [improving, setImproving] = useState(false)
  const [tone, setTone] = useState<Tone>("Friendly")

  // Template picker state
  const [templates, setTemplates] = useState<Template[]>([])
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const templateRef = useRef<HTMLDivElement>(null)

  // Close template dropdown on outside click
  useEffect(() => {
    if (!templatesOpen) return
    function handleClick(e: MouseEvent) {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setTemplatesOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [templatesOpen])

  async function openTemplates() {
    setTemplatesOpen((prev) => !prev)
    if (templates.length === 0 && !templatesLoading) {
      setTemplatesLoading(true)
      try {
        const res = await fetch("/api/templates")
        if (!res.ok) throw new Error("Failed to fetch templates")
        const data = await res.json()
        setTemplates(Array.isArray(data) ? data : (data.templates ?? []))
      } catch {
        toast.error("Could not load templates")
        setTemplates([])
      } finally {
        setTemplatesLoading(false)
      }
    }
  }

  function applyTemplate(template: Template) {
    setDraft(template.body)
    setTemplatesOpen(false)
  }

  function buildInstruction() {
    const base = instruction.trim()
    return base ? `${base}\nTone: ${tone}` : `Tone: ${tone}`
  }

  async function generateDraft() {
    setGenerating(true)
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, instruction: buildInstruction() }),
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
        body: JSON.stringify({ draft, instruction: buildInstruction() }),
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
      onSent ? onSent() : onClose()
    } catch {
      toast.error("Failed to send")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t border-taupe bg-white shrink-0 shadow-[0_-4px_16px_rgba(45,42,38,0.06)]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-taupe">
        <Sparkles className="w-4 h-4 text-slate-blue" />
        <span className="text-[15px] font-semibold text-espresso">AI Draft</span>
        <button onClick={onClose} className="ml-auto w-7 h-7 flex items-center justify-center rounded hover:bg-taupe/40 transition-colors">
          <X className="w-[17px] h-[17px] text-stone-warm" />
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* To field */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-warm w-4 font-medium">To</span>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 text-sm border-taupe focus:border-sand focus:ring-sand/15"
            placeholder="recipient@example.com"
          />
        </div>

        {/* Tone selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-stone-warm font-medium">Tone:</span>
          {TONE_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTone(t)}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-medium tracking-wide border transition-colors duration-150 select-none",
                tone === t
                  ? "bg-slate-blue border-slate-blue text-white"
                  : "bg-white border-taupe text-stone-warm hover:bg-blue-light/50"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Instruction row with Templates button */}
        <div className="flex gap-2">
          <Input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            className="h-8 text-sm flex-1"
            placeholder="Instructions (e.g. 'be brief', 'ask for a call', 'decline politely')..."
            onKeyDown={(e) => { if (e.key === "Enter") draft ? improveDraft() : generateDraft() }}
          />

          {/* Templates picker */}
          <div className="relative shrink-0" ref={templateRef}>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              onClick={openTemplates}
              type="button"
            >
              <FileText className="w-3.5 h-3.5" />
              Templates
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
            {templatesOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-md border bg-popover shadow-md text-popover-foreground">
                {templatesLoading ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Loading…</p>
                ) : templates.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No templates found.</p>
                ) : (
                  <ul className="py-1 max-h-48 overflow-y-auto">
                    {templates.map((tpl) => (
                      <li key={tpl.id}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => applyTemplate(tpl)}
                        >
                          {tpl.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <button
            onClick={draft ? improveDraft : generateDraft}
            disabled={generating || improving}
            className="h-8 px-3.5 rounded-[10px] bg-espresso text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 hover:bg-espresso/85 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generating || improving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : draft ? (
              <><Wand2 className="w-3.5 h-3.5" /> Improve</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" /> Generate</>
            )}
          </button>
        </div>

        {/* Smart reply chips — shown only when draft is empty */}
        {!draft && (
          <SmartReplyChips
            threadId={threadId}
            onSelect={(text) => setDraft(text)}
          />
        )}

        {/* Draft textarea */}
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={generating ? "Generating..." : "Your reply will appear here..."}
          className={cn("min-h-[120px] text-sm resize-y border-taupe focus:border-sand focus:ring-sand/15 text-espresso placeholder:text-tan", generating && "opacity-60")}
          disabled={generating}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-warm hover:text-espresso transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={generateDraft}
            disabled={generating}
            className="h-9 px-3 rounded-[10px] border border-taupe text-stone-warm text-xs font-medium flex items-center gap-1.5 hover:border-stone-warm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", generating && "animate-spin")} />
            Regenerate
          </button>
          <button
            onClick={sendEmail}
            disabled={!draft.trim() || sending}
            className="h-9 px-4 rounded-[10px] bg-sage text-white text-xs font-semibold flex items-center gap-2 hover:bg-sage/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  )
}
