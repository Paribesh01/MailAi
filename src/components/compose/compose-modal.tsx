"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Send, X } from "lucide-react"

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
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error("Fill in all fields")
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
      onClose()
      setTo(""); setSubject(""); setBody("")
    } catch {
      toast.error("Failed to send email")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New Email</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
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

          <div className="space-y-1">
            <Label className="text-xs">Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              className="min-h-[200px] resize-none text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-3.5 h-3.5 mr-1.5" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSend} disabled={sending} className="gap-1.5">
              <Send className="w-3.5 h-3.5" />
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
