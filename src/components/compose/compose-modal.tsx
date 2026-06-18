"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Send, X, Sparkles, RefreshCw, Wand2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Tone = "Friendly" | "Formal" | "Brief" | "Assertive"
const TONES: Tone[] = ["Friendly", "Formal", "Brief", "Assertive"]

interface ComposeModalProps {
  open: boolean
  onClose: () => void
  userEmail: string
  defaultTo?: string
  defaultSubject?: string
}

export function ComposeModal({ open, onClose, defaultTo = "", defaultSubject = "" }: ComposeModalProps) {
  const [to, setTo] = useState(defaultTo)
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState("")
  const [instruction, setInstruction] = useState("")
  const [tone, setTone] = useState<Tone>("Friendly")
  const [sending, setSending] = useState(false)
  const [generating, setGenerating] = useState(false)

  function reset() {
    setTo(defaultTo)
    setSubject(defaultSubject)
    setBody("")
    setInstruction("")
    setTone("Friendly")
  }

  async function generateBody() {
    if (!subject.trim() && !instruction.trim()) {
      toast.error("Enter a subject or instructions first")
      return
    }
    setGenerating(true)
    try {
      const res = await fetch("/api/ai/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, instruction, tone }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setBody(data.body)
    } catch {
      toast.error("Failed to generate email")
    } finally {
      setGenerating(false)
    }
  }

  async function handleSend() {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error("Fill in To, Subject, and Message")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Email sent!")
      reset()
      onClose()
    } catch {
      toast.error("Failed to send email")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 bg-white rounded-2xl shadow-[0_8px_32px_rgba(45,42,38,0.18)] border-taupe overflow-hidden">
        {/* Header */}
        <DialogHeader className="flex-row items-center justify-between px-6 py-5 border-b border-taupe">
          <DialogTitle className="text-[22px] font-semibold text-espresso tracking-tight">
            New Message
          </DialogTitle>
          <button
            onClick={() => { reset(); onClose() }}
            className="w-8 h-8 flex items-center justify-center rounded-[10px] hover:bg-taupe/50 transition-colors"
          >
            <X className="w-5 h-5 text-stone-warm hover:text-espresso" />
          </button>
        </DialogHeader>

        <div className="px-6 py-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* To */}
          <div>
            <label className="text-xs font-medium text-stone-warm tracking-wide mb-1.5 block">To</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full h-[42px] border border-taupe rounded-[10px] px-3.5 text-sm text-espresso placeholder:text-tan focus:border-sand focus:ring-2 focus:ring-sand/15 outline-none transition-all"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-medium text-stone-warm tracking-wide mb-1.5 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What's this about?"
              className="w-full h-[42px] border border-taupe rounded-[10px] px-3.5 text-sm text-espresso placeholder:text-tan focus:border-sand focus:ring-2 focus:ring-sand/15 outline-none transition-all"
            />
          </div>

          {/* AI Compose section */}
          <div className="bg-blue-light rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-slate-blue" />
              <h3 className="text-[15px] font-semibold text-espresso">AI Compose</h3>
            </div>

            {/* Tone */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-wide transition-colors duration-150 cursor-pointer",
                    tone === t
                      ? "bg-slate-blue text-white"
                      : "bg-white text-stone-warm border border-taupe hover:bg-blue-light/80"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Instruction */}
            <div className="mb-3">
              <label className="text-xs font-medium text-stone-warm tracking-wide mb-1.5 block">
                What should AI write?
              </label>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generateBody() } }}
                placeholder="e.g. Ask for a meeting next week to discuss the proposal"
                rows={2}
                className="w-full border border-[#c4cdd8] rounded-xl px-3.5 py-2.5 text-sm text-espresso placeholder:text-tan focus:border-slate-blue focus:ring-2 focus:ring-slate-blue/15 outline-none transition-all resize-none bg-white"
              />
            </div>

            {/* Generate button */}
            <button
              onClick={generateBody}
              disabled={generating || (!subject.trim() && !instruction.trim())}
              className="w-full h-10 rounded-[10px] bg-espresso text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-espresso/85 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              ) : body ? (
                <><Wand2 className="w-4 h-4" /> Regenerate</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Draft</>
              )}
            </button>
          </div>

          {/* Message body */}
          <div>
            <label className="text-xs font-medium text-stone-warm tracking-wide mb-1.5 block">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={generating ? "Generating…" : "Write your message or use AI to generate it…"}
              className={cn(
                "w-full min-h-[180px] border border-taupe rounded-xl p-3.5 text-sm text-espresso leading-relaxed placeholder:text-tan focus:border-sand focus:ring-2 focus:ring-sand/15 outline-none transition-all resize-y",
                generating && "opacity-60"
              )}
              disabled={generating}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-taupe">
          <button
            onClick={() => { reset(); onClose() }}
            className="px-4 py-2 text-sm font-medium text-stone-warm hover:text-espresso transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !to.trim() || !body.trim()}
            className="w-[120px] h-10 rounded-[10px] bg-sage text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-sage/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
