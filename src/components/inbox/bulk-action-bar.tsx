"use client"

import { Thread } from "@/types/email"
import { Button } from "@/components/ui/button"
import { Archive, Star, Trash2, X } from "lucide-react"
import { toast } from "sonner"

interface BulkActionBarProps {
  selectedIds: Set<string>
  onClear: () => void
  onUpdate: (id: string, updates: Partial<Thread>) => void
}

export function BulkActionBar({ selectedIds, onClear, onUpdate }: BulkActionBarProps) {
  if (selectedIds.size === 0) return null

  const ids = Array.from(selectedIds)

  async function handleArchiveAll() {
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/threads/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isArchived: true }),
          })
        )
      )
      ids.forEach((id) => onUpdate(id, { isArchived: true }))
      onClear()
      toast.success(`${ids.length} thread${ids.length > 1 ? "s" : ""} archived`)
    } catch {
      toast.error("Failed to archive threads")
    }
  }

  async function handleStarAll() {
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/threads/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isStarred: true }),
          })
        )
      )
      ids.forEach((id) => onUpdate(id, { isStarred: true }))
      onClear()
      toast.success(`${ids.length} thread${ids.length > 1 ? "s" : ""} starred`)
    } catch {
      toast.error("Failed to star threads")
    }
  }

  async function handleTrashAll() {
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/threads/${id}`, {
            method: "DELETE",
          })
        )
      )
      ids.forEach((id) => onUpdate(id, {}))
      onClear()
      toast.success(`${ids.length} thread${ids.length > 1 ? "s" : ""} moved to trash`)
    } catch {
      toast.error("Failed to move threads to trash")
    }
  }

  return (
    <div className="relative flex items-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600/90 to-purple-600/90 px-4 py-2.5 shadow-lg">
      <span className="text-sm font-medium text-white">
        {selectedIds.size} selected
      </span>

      <div className="mx-1 h-4 w-px bg-white/30" />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleArchiveAll}
          className="h-8 gap-1.5 text-white hover:bg-white/20 hover:text-white"
        >
          <Archive className="h-4 w-4" />
          <span className="text-xs">Archive all</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleStarAll}
          className="h-8 gap-1.5 text-white hover:bg-white/20 hover:text-white"
        >
          <Star className="h-4 w-4" />
          <span className="text-xs">Star all</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleTrashAll}
          className="h-8 gap-1.5 text-white hover:bg-white/20 hover:text-white"
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-xs">Move to Trash</span>
        </Button>
      </div>

      <div className="ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 w-8 p-0 text-white hover:bg-white/20 hover:text-white"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear selection</span>
        </Button>
      </div>
    </div>
  )
}
