"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { CheckSquare, Square, Sparkles, Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ActionItem {
  id: string
  threadId: string
  description: string
  isDone: boolean
  createdAt: string
}

interface ActionItemsPanelProps {
  threadId: string
}

export function ActionItemsPanel({ threadId }: ActionItemsPanelProps) {
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadActionItems = useCallback(async () => {
    if (!threadId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/ai/actions?threadId=${encodeURIComponent(threadId)}`)
      if (!res.ok) throw new Error("Failed to load action items")
      const data = await res.json()
      setActionItems(data.actionItems ?? [])
    } catch {
      toast.error("Could not load action items")
    } finally {
      setIsLoading(false)
    }
  }, [threadId])

  useEffect(() => {
    loadActionItems()
  }, [loadActionItems])

  const extractActionItems = async () => {
    setIsExtracting(true)
    try {
      const res = await fetch("/api/ai/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId }),
      })
      if (!res.ok) throw new Error("Failed to extract action items")
      const data = await res.json()
      setActionItems(data.actionItems ?? [])
      toast.success("Action items extracted")
    } catch {
      toast.error("Could not extract action items")
    } finally {
      setIsExtracting(false)
    }
  }

  const toggleItem = async (item: ActionItem) => {
    setTogglingId(item.id)
    const optimisticItems = actionItems.map((a) =>
      a.id === item.id ? { ...a, isDone: !a.isDone } : a
    )
    setActionItems(optimisticItems)
    try {
      const res = await fetch("/api/ai/actions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isDone: !item.isDone }),
      })
      if (!res.ok) throw new Error("Failed to update action item")
    } catch {
      setActionItems(actionItems)
      toast.error("Could not update action item")
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Action Items</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={loadActionItems}
            disabled={isLoading || isExtracting}
            title="Refresh"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5 text-muted-foreground", isLoading && "animate-spin")}
            />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-xs"
            onClick={extractActionItems}
            disabled={isExtracting || isLoading}
          >
            {isExtracting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isExtracting ? "Extracting…" : "Extract action items"}
          </Button>
        </div>
      </div>

      {isLoading && !actionItems.length ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : actionItems.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No action items yet. Click &quot;Extract action items&quot; to generate them with AI.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {actionItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => toggleItem(item)}
                disabled={togglingId === item.id}
                className={cn(
                  "group flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors",
                  "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  item.isDone && "opacity-60"
                )}
              >
                <span className="mt-0.5 shrink-0 transition-transform duration-150 group-hover:scale-110">
                  {togglingId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : item.isDone ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  )}
                </span>
                <span
                  className={cn(
                    "leading-snug transition-all duration-200",
                    item.isDone && "line-through decoration-muted-foreground"
                  )}
                >
                  {item.description}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
