"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Send, X, Sparkles, RefreshCw, Wand2 } from "lucide-react"
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            New Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* To + Subject */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                type="email"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
          </div>

          {/* AI section */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              AI Compose
            </div>

            {/* Tone */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground">Tone:</span>
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                    tone === t
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "border-border text-muted-foreground hover:border-indigo-400 hover:text-indigo-400"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Instruction + generate button */}
            <div className="flex gap-2">
              <Input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="What should this email say? (e.g. 'ask for a meeting next week')"
                className="h-8 text-sm bg-background"
                onKeyDown={(e) => { if (e.key === "Enter") generateBody() }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 shrink-0 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                onClick={generateBody}
                disabled={generating}
              >
                {generating
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : body
                  ? <><Wand2 className="w-3.5 h-3.5" /> Regenerate</>
                  : <><Sparkles className="w-3.5 h-3.5" /> Generate</>
                }
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-1">
            <Label className="text-xs">Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={generating ? "Generating..." : "Write your message or use AI to generate it…"}
              className={cn("min-h-[200px] resize-none text-sm", generating && "opacity-60")}
              disabled={generating}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { reset(); onClose() }}>
              <X className="w-3.5 h-3.5 mr-1.5" /> Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={sending || !body.trim()}
              className="gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 text-white"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
