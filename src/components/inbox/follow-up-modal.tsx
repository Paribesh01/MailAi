"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Bell } from "lucide-react"
import { toast } from "sonner"
import { addDays, format } from "date-fns"

interface FollowUpModalProps {
  open: boolean
  onClose: () => void
  threadId: string
  onScheduled: () => void
}

const QUICK_OPTIONS = [
  { label: "Tomorrow", days: 1 },
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
]

export function FollowUpModal({ open, onClose, threadId, onScheduled }: FollowUpModalProps) {
  const [date, setDate] = useState(format(addDays(new Date(), 3), "yyyy-MM-dd"))
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  async function handleAiSuggest() {
    setAiLoading(true)
    try {
      const res = await fetch("/api/ai/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId }),
      })
      const data = await res.json()
      setMessage(data.message)
      setDate(format(new Date(data.scheduledFor), "yyyy-MM-dd"))
      toast.success("AI suggested a follow-up")
      onScheduled()
      onClose()
    } catch {
      toast.error("AI suggestion failed")
    } finally {
      setAiLoading(false)
    }
  }

  async function handleManualSchedule() {
    setLoading(true)
    try {
      await fetch("/api/ai/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, manualDate: date, manualMessage: message }),
      })
      toast.success("Follow-up scheduled")
      onScheduled()
      onClose()
    } catch {
      toast.error("Failed to schedule")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-4 h-4" /> Schedule Follow-up
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* AI suggest */}
          <Button
            variant="outline"
            className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
            onClick={handleAiSuggest}
            disabled={aiLoading}
          >
            <Sparkles className="w-4 h-4" />
            {aiLoading ? "AI is thinking..." : "Let AI decide timing & message"}
          </Button>

          <div className="relative flex items-center">
            <div className="flex-1 border-t" />
            <span className="mx-3 text-xs text-muted-foreground">or set manually</span>
            <div className="flex-1 border-t" />
          </div>

          {/* Quick picks */}
          <div className="flex gap-2">
            {QUICK_OPTIONS.map(({ label, days }) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setDate(format(addDays(new Date(), days), "yyyy-MM-dd"))}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-xs">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label className="text-xs">Reminder message (optional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Check if they replied about the proposal"
              className="resize-none text-sm"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleManualSchedule} disabled={loading}>
              {loading ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
