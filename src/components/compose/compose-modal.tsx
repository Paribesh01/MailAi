"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Send, X, Sparkles, Wand2, Loader2, Clock, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, addHours, addDays } from "date-fns"
import { textToEmailHtml } from "@/lib/email-html"

type Tone = "Friendly" | "Formal" | "Brief" | "Assertive" | "Warm" | "Casual" | "Professional"
const TONES: Tone[] = ["Friendly", "Formal", "Brief", "Assertive", "Warm", "Casual", "Professional"]

const SCHEDULE_PRESETS = [
  { label: "In 1 hour", getDate: () => addHours(new Date(), 1) },
  { label: "In 3 hours", getDate: () => addHours(new Date(), 3) },
  { label: "Tomorrow 9am", getDate: () => { const d = addDays(new Date(), 1); d.setHours(9, 0, 0, 0); return d } },
  { label: "Monday 9am", getDate: () => { const d = new Date(); const day = d.getDay(); const diff = (8 - day) % 7 || 7; const next = addDays(d, diff); next.setHours(9, 0, 0, 0); return next } },
]

const EMAIL_RE = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/

const isPast = (d: Date) => d.getTime() <= Date.now()

function parseRecipients(value: string) {
  return value.split(/[,;\s]+/).map((v) => v.trim()).filter(Boolean)
}

interface ComposeModalProps {
  open: boolean
  onClose: () => void
  userEmail: string
  defaultTo?: string
  defaultSubject?: string
  defaultBody?: string
  title?: string
}

export function ComposeModal({
  open,
  onClose,
  defaultTo = "",
  defaultSubject = "",
  defaultBody = "",
  title = "New Message",
}: ComposeModalProps) {
  const [to, setTo] = useState(defaultTo)
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState(defaultBody)
  const [instruction, setInstruction] = useState("")
  const [tone, setTone] = useState<Tone>("Friendly")
  const [signature, setSignature] = useState("")
  const [sending, setSending] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Schedule state
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null)
  const [customDateStr, setCustomDateStr] = useState("")
  const [showCustomDate, setShowCustomDate] = useState(false)
  const scheduleRef = useRef<HTMLDivElement>(null)

  // Load saved writing tone and signature
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.writingTone) setTone(d.writingTone as Tone)
        if (d.emailSignature) setSignature(d.emailSignature)
      })
      .catch(() => {})
  }, [])

  // Re-apply prefilled values each time the modal opens (e.g. Forward from a different thread)
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setTo(defaultTo)
      setSubject(defaultSubject)
      setBody(defaultBody)
    }
  }

  // Close the schedule menu on outside click / Escape
  useEffect(() => {
    if (!showSchedule) return
    const onDown = (e: MouseEvent) => {
      if (!scheduleRef.current?.contains(e.target as Node)) setShowSchedule(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowSchedule(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [showSchedule])

  function reset() {
    setTo(defaultTo); setSubject(defaultSubject); setBody(defaultBody); setInstruction("")
    // Keep tone — don't reset to Friendly, user may have changed it intentionally
    setScheduledAt(null); setShowSchedule(false); setShowCustomDate(false); setCustomDateStr("")
  }

  function close() {
    reset()
    onClose()
  }

  async function generateBody() {
    if (!subject.trim() && !instruction.trim()) { toast.error("Enter a subject or instructions first"); return }
    setGenerating(true)
    try {
      const res = await fetch("/api/ai/compose", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, instruction, tone }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error)
      setBody(data.body)
    } catch { toast.error("Failed to generate email") }
    finally { setGenerating(false) }
  }

  const recipients = parseRecipients(to)
  const invalidRecipient = recipients.find((r) => !EMAIL_RE.test(r))
  const canSend = recipients.length > 0 && !invalidRecipient && !!subject.trim() && !!body.trim() && !sending

  async function handleSend() {
    if (invalidRecipient) { toast.error(`"${invalidRecipient}" isn't a valid email address`); return }
    if (!canSend) { toast.error("Fill in To, Subject, and Message"); return }
    if (scheduledAt && isPast(scheduledAt)) { toast.error("Pick a time in the future"); return }

    setSending(true)
    const html = textToEmailHtml(body, signature)
    const toValue = recipients.join(", ")
    try {
      const res = scheduledAt
        ? await fetch("/api/scheduled-emails", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: toValue, subject, body: html, scheduledAt: scheduledAt.toISOString() }),
          })
        : await fetch("/api/emails", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: toValue, subject, html }),
          })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error)
      }
      toast.success(scheduledAt ? `Scheduled for ${format(scheduledAt, "MMM d 'at' h:mm a")}` : "Email sent!")
      close()
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to send email")
    } finally {
      setSending(false)
    }
  }

  function pickPreset(preset: typeof SCHEDULE_PRESETS[0]) {
    setScheduledAt(preset.getDate())
    setShowSchedule(false)
    setShowCustomDate(false)
  }

  function confirmCustomDate() {
    const d = new Date(customDateStr)
    if (!customDateStr || isNaN(d.getTime())) return
    if (isPast(d)) { toast.error("Pick a time in the future"); return }
    setScheduledAt(d)
    setShowSchedule(false)
    setShowCustomDate(false)
  }

  const inputClass = "w-full h-[42px] border border-taupe rounded-[10px] px-3.5 text-sm text-espresso placeholder:text-tan focus:border-sand focus:ring-2 focus:ring-sand/15 outline-none transition-all"

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close() }}>
      <DialogContent
        className="sm:max-w-[600px] p-0 gap-0 bg-white rounded-2xl shadow-[0_8px_32px_rgba(45,42,38,0.18)] border-taupe overflow-hidden"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            handleSend()
          }
        }}
      >
        <DialogHeader className="flex-row items-center justify-between px-6 py-5 border-b border-taupe">
          <DialogTitle className="text-[22px] font-semibold text-espresso tracking-tight">{title}</DialogTitle>
          <button onClick={close} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-[10px] hover:bg-taupe/50 transition-colors">
            <X className="w-5 h-5 text-stone-warm hover:text-espresso" />
          </button>
        </DialogHeader>

        <div className="px-6 py-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* To */}
          <div>
            <label htmlFor="compose-to" className="text-xs font-medium text-stone-warm tracking-wide mb-1.5 block">To</label>
            <input id="compose-to" type="text" inputMode="email" autoComplete="email" value={to}
              onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com, another@example.com"
              aria-invalid={!!invalidRecipient}
              className={cn(inputClass, invalidRecipient && to.trim() && "border-coral focus:border-coral focus:ring-coral/15")} />
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="compose-subject" className="text-xs font-medium text-stone-warm tracking-wide mb-1.5 block">Subject</label>
            <input id="compose-subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="What's this about?" className={inputClass} />
          </div>

          {/* AI Compose */}
          <div className="bg-blue-light rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-slate-blue" />
              <h3 className="text-[15px] font-semibold text-espresso">AI Compose</h3>
            </div>
            <div className="flex gap-2 mb-3 flex-wrap" role="radiogroup" aria-label="Tone">
              {TONES.map((t) => (
                <button key={t} type="button" role="radio" aria-checked={tone === t} onClick={() => setTone(t)}
                  className={cn("px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-wide transition-colors duration-150 cursor-pointer",
                    tone === t ? "bg-slate-blue text-white" : "bg-white text-stone-warm border border-taupe hover:bg-blue-light/80")}>
                  {t}
                </button>
              ))}
            </div>
            <div className="mb-3">
              <label htmlFor="compose-instruction" className="text-xs font-medium text-stone-warm tracking-wide mb-1.5 block">What should AI write?</label>
              <textarea id="compose-instruction" value={instruction} onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) { e.preventDefault(); generateBody() } }}
                placeholder="e.g. Ask for a meeting next week to discuss the proposal" rows={2}
                className="w-full border border-[#c4cdd8] rounded-xl px-3.5 py-2.5 text-sm text-espresso placeholder:text-tan focus:border-slate-blue focus:ring-2 focus:ring-slate-blue/15 outline-none transition-all resize-none bg-white" />
            </div>
            <button onClick={generateBody} disabled={generating || (!subject.trim() && !instruction.trim())}
              className="w-full h-10 rounded-[10px] bg-espresso text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-espresso/85 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : body ? <><Wand2 className="w-4 h-4" /> Regenerate</> : <><Sparkles className="w-4 h-4" /> Generate Draft</>}
            </button>
          </div>

          {/* Message body */}
          <div>
            <label htmlFor="compose-body" className="text-xs font-medium text-stone-warm tracking-wide mb-1.5 block">Message</label>
            <textarea id="compose-body" value={body} onChange={(e) => setBody(e.target.value)}
              placeholder={generating ? "Generating…" : "Write your message or use AI to generate it…"}
              className={cn("w-full min-h-[180px] border border-taupe rounded-xl p-3.5 text-sm text-espresso leading-relaxed placeholder:text-tan focus:border-sand focus:ring-2 focus:ring-sand/15 outline-none transition-all resize-y", generating && "opacity-60")}
              disabled={generating} />
            {signature && (
              <p className="mt-1.5 text-[11px] text-stone-warm/70">Your signature will be added when you send.</p>
            )}
          </div>

          {/* Scheduled banner */}
          {scheduledAt && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-sand/10 border border-sand/30">
              <div className="flex items-center gap-2 text-sm text-espresso">
                <Clock className="w-4 h-4 text-sand" />
                Scheduled for <span className="font-semibold">{format(scheduledAt, "MMM d 'at' h:mm a")}</span>
              </div>
              <button onClick={() => setScheduledAt(null)} className="text-xs text-stone-warm hover:text-coral">Remove</button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-taupe">
          <p className="text-[11px] text-stone-warm/60 hidden sm:block">⌘/Ctrl + Enter to send · Read receipt on</p>

          <div className="flex items-center gap-2 ml-auto">
            <button onClick={close} className="px-4 py-2 text-sm font-medium text-stone-warm hover:text-espresso transition-colors">
              Cancel
            </button>

            {/* Split button: Send / Schedule + Send-later menu */}
            <div className="relative flex" ref={scheduleRef}>
              <button onClick={handleSend} disabled={!canSend}
                className="h-10 px-5 rounded-l-[10px] bg-sage text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-sage/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : scheduledAt ? <Clock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {sending ? "Sending…" : scheduledAt ? "Schedule" : "Send"}
              </button>
              <button onClick={() => setShowSchedule((v) => !v)} disabled={sending}
                aria-label="Send later" aria-expanded={showSchedule}
                className="h-10 px-2.5 rounded-r-[10px] border-l border-white/30 bg-sage text-white flex items-center gap-1 hover:bg-sage/85 transition-colors disabled:opacity-50">
                <Clock className="w-3.5 h-3.5" />
                <ChevronDown className="w-3 h-3" />
              </button>

              {showSchedule && (
                <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-xl border border-taupe shadow-[0_8px_32px_rgba(45,42,38,0.12)] z-50 overflow-hidden">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-warm px-3 py-2 border-b border-taupe">Send later</p>
                  {SCHEDULE_PRESETS.map((p) => (
                    <button key={p.label} onClick={() => pickPreset(p)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-espresso hover:bg-cream transition-colors">
                      <span>{p.label}</span>
                      <span className="text-[11px] text-stone-warm">{format(p.getDate(), "EEE h:mm a")}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setShowCustomDate(true)
                      setCustomDateStr(format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"))
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-espresso hover:bg-cream transition-colors">
                    Custom…
                  </button>
                  {showCustomDate && (
                    <div className="px-3 pb-3 space-y-2 border-t border-taupe pt-2">
                      <input type="datetime-local" value={customDateStr}
                        min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                        onChange={(e) => setCustomDateStr(e.target.value)}
                        className="w-full h-8 px-2 text-xs rounded-lg border border-taupe bg-cream text-espresso focus:outline-none" />
                      <button onClick={confirmCustomDate} className="w-full h-7 rounded-lg bg-espresso text-white text-xs font-semibold">
                        Confirm
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
