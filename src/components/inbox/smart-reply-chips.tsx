"use client"

import { useEffect, useState } from "react"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface SmartReplyChipsProps {
  threadId: string
  onSelect: (text: string) => void
}

export function SmartReplyChips({ threadId, onSelect }: SmartReplyChipsProps) {
  const [replies, setReplies] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchReplies() {
      setLoading(true)
      try {
        const res = await fetch("/api/ai/smart-reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId }),
        })
        if (!res.ok) throw new Error("Failed to fetch smart replies")
        const data = await res.json()
        if (!cancelled) {
          setReplies(Array.isArray(data.replies) ? data.replies.slice(0, 3) : [])
        }
      } catch {
        if (!cancelled) setReplies([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchReplies()
    return () => {
      cancelled = true
    }
  }, [threadId])

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            className="h-7 w-28 rounded-full"
          />
        ))}
      </div>
    )
  }

  if (replies.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="text-[11px] font-medium text-stone-warm">Quick replies</span>
      {replies.map((text, index) => (
        <Button
          key={index}
          variant="ghost"
          size="sm"
          onClick={() => onSelect(text)}
          className="h-7 max-w-full rounded-full px-3 text-xs font-medium gap-1 border border-taupe bg-white text-espresso hover:bg-sand-light/50 hover:border-sand hover:text-espresso shadow-[0_1px_2px_rgba(45,42,38,0.06)]"
        >
          <Zap className="h-3 w-3 shrink-0 text-sand" />
          <span className="truncate">{text}</span>
        </Button>
      ))}
    </div>
  )
}
