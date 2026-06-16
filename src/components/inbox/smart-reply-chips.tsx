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
    <div className="flex flex-wrap gap-2">
      {replies.map((text, index) => (
        <Button
          key={index}
          variant="ghost"
          size="sm"
          onClick={() => onSelect(text)}
          className="h-7 rounded-full px-3 text-xs font-medium text-white
            bg-gradient-to-r from-indigo-500 to-purple-500
            hover:from-indigo-600 hover:to-purple-600
            hover:text-white
            shadow-sm transition-all duration-150
            border-0 gap-1"
        >
          <Zap className="h-3 w-3 shrink-0" />
          {text}
        </Button>
      ))}
    </div>
  )
}
