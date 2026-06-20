"use client"

import { useState } from "react"
import { Users, Sparkles, Send, Loader2, CheckCircle2, XCircle, Eye } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Recipient { email: string; name?: string; [key: string]: string | undefined }
interface Result { email: string; status: "sent" | "failed"; error?: string }

function parseRecipients(raw: string): Recipient[] {
  return raw
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // Support: "John Doe <john@example.com>" or "john@example.com" or "john@example.com, John"
      const angleMatch = line.match(/^(.+?)\s*<([^>]+)>$/)
      if (angleMatch) return { name: angleMatch[1].trim(), email: angleMatch[2].trim() }
      const parts = line.split(/\s+/)
      if (parts.length >= 2 && parts[parts.length - 1].includes("@")) {
        return { name: parts.slice(0, -1).join(" "), email: parts[parts.length - 1] }
      }
      return { email: line }
    })
    .filter((r) => r.email.includes("@"))
}

function interpolate(template: string, vars: Record<string, string | undefined>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

export function MergeView() {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [recipientRaw, setRecipientRaw] = useState("")
  const [enableTracking, setEnableTracking] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<Result[] | null>(null)

  const recipients = parseRecipients(recipientRaw)
  const previewRecipient = recipients[0]

  const previewSubject = previewRecipient
    ? interpolate(subject, { name: previewRecipient.name ?? previewRecipient.email.split("@")[0], email: previewRecipient.email })
    : subject

  const previewBody = previewRecipient
    ? interpolate(body, { name: previewRecipient.name ?? previewRecipient.email.split("@")[0], email: previewRecipient.email })
    : body

  async function handleSend() {
    if (!subject.trim() || !body.trim() || recipients.length === 0) {
      toast.error("Fill in subject, body, and at least one recipient")
      return
    }
    if (!confirm(`Send to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}?`)) return
    setSending(true)
    setResults(null)
    try {
      const res = await fetch("/api/mail-merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, recipients, enableTracking }),
      })
      const d = await res.json()
      setResults(d.results)
      const sentCount = d.results.filter((r: Result) => r.status === "sent").length
      toast.success(`Sent to ${sentCount}/${recipients.length} recipients`)
    } catch {
      toast.error("Mail merge failed")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-full bg-cream overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-blue/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-slate-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-espresso tracking-tight">Mail Merge</h1>
            <p className="text-sm text-stone-warm">Send personalized emails to many recipients at once</p>
          </div>
        </div>

        {/* Variable hint */}
        <div className="px-4 py-3 rounded-xl bg-blue-light border border-slate-blue/10 text-sm text-slate-blue">
          <span className="font-semibold">Variables:</span> use{" "}
          {["{{name}}", "{{email}}"].map((v) => (
            <code key={v} className="mx-1 px-1.5 py-0.5 bg-white rounded text-xs font-mono">{v}</code>
          ))}
          in subject or body — auto-filled per recipient.
        </div>

        <div className="grid grid-cols-1 gap-5">
          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-stone-warm">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="Hey {{name}}, quick update on your account"
              className="w-full h-11 px-3.5 rounded-xl border border-taupe bg-white text-sm text-espresso placeholder:text-stone-warm/40 focus:outline-none focus:ring-1 focus:ring-slate-blue/30" />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-stone-warm">Body</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8}
              placeholder={"Hi {{name}},\n\nI wanted to reach out personally...\n\nBest,\nYour name"}
              className="w-full px-3.5 py-3 rounded-xl border border-taupe bg-white text-sm text-espresso placeholder:text-stone-warm/40 focus:outline-none focus:ring-1 focus:ring-slate-blue/30 resize-y leading-relaxed" />
          </div>

          {/* Recipients */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-stone-warm">
              Recipients
              {recipients.length > 0 && <span className="ml-2 text-slate-blue font-normal normal-case">{recipients.length} parsed</span>}
            </label>
            <textarea value={recipientRaw} onChange={(e) => setRecipientRaw(e.target.value)} rows={5}
              placeholder={"john@example.com\nJane Doe <jane@example.com>\nbob@example.com"}
              className="w-full px-3.5 py-3 rounded-xl border border-taupe bg-white text-sm text-espresso placeholder:text-stone-warm/40 focus:outline-none focus:ring-1 focus:ring-slate-blue/30 resize-y font-mono" />
            <p className="text-[11px] text-stone-warm">One per line. Formats: <code>email@domain.com</code> or <code>Name &lt;email@domain.com&gt;</code></p>
          </div>

          {/* Options */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={enableTracking} onChange={(e) => setEnableTracking(e.target.checked)}
                className="w-4 h-4 rounded accent-slate-blue" />
              <span className="text-sm text-espresso">Enable read receipts</span>
            </label>
          </div>

          {/* Preview */}
          {recipients.length > 0 && subject && body && (
            <div>
              <button onClick={() => setShowPreview((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-blue hover:underline">
                <Eye className="w-3.5 h-3.5" />
                {showPreview ? "Hide preview" : "Preview first email"}
              </button>
              {showPreview && (
                <div className="mt-3 p-4 rounded-xl border border-taupe bg-white space-y-2">
                  <p className="text-xs text-stone-warm">To: <span className="text-espresso">{previewRecipient?.email}</span></p>
                  <p className="text-xs text-stone-warm">Subject: <span className="text-espresso font-medium">{previewSubject}</span></p>
                  <div className="pt-2 border-t border-taupe text-sm text-espresso whitespace-pre-wrap leading-relaxed">{previewBody}</div>
                </div>
              )}
            </div>
          )}

          {/* Send */}
          <button onClick={handleSend} disabled={sending || !subject || !body || recipients.length === 0}
            className="h-11 w-full rounded-xl bg-espresso text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-espresso/85 transition-colors disabled:opacity-40">
            {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending… (1/sec)</> : <><Send className="w-4 h-4" /> Send to {recipients.length || "—"} recipients</>}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-warm px-1">Results</p>
            {results.map((r) => (
              <div key={r.email} className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm",
                r.status === "sent" ? "bg-sage/5 border-sage/20" : "bg-coral/5 border-coral/20")}>
                {r.status === "sent" ? <CheckCircle2 className="w-4 h-4 text-sage shrink-0" /> : <XCircle className="w-4 h-4 text-coral shrink-0" />}
                <span className="flex-1 truncate text-espresso">{r.email}</span>
                {r.error && <span className="text-xs text-coral truncate">{r.error}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
