"use client"

import { useState } from "react"
import { Thread } from "@/types/email"
import { Button } from "@/components/ui/button"
import { Archive, Star, Trash2, X, MailOpen, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { patchThread } from "@/lib/thread-api"

interface BulkActionBarProps {
  selectedIds: Set<string>
  onClear: () => void
  onUpdate: (id: string, updates: Partial<Thread>) => void
}

const plural = (n: number) => `${n} thread${n === 1 ? "" : "s"}`

export function BulkActionBar({ selectedIds, onClear, onUpdate }: BulkActionBarProps) {
  const [busy, setBusy] = useState<string | null>(null)
  if (selectedIds.size === 0) return null

  const ids = Array.from(selectedIds)

  // Run an action for every selected thread, keep failures selected, and report partial success
  async function runBulk(
    key: string,
    action: (id: string) => Promise<unknown>,
    applied: Partial<Thread>,
    verb: string
  ) {
    setBusy(key)
    const results = await Promise.allSettled(ids.map(action))
    const succeeded = ids.filter((_, i) => results[i].status === "fulfilled")
    const failed = ids.length - succeeded.length
    succeeded.forEach((id) => onUpdate(id, applied))
    setBusy(null)

    if (failed === 0) {
      onClear()
      toast.success(`${plural(succeeded.length)} ${verb}`)
    } else if (succeeded.length > 0) {
      toast.warning(`${plural(succeeded.length)} ${verb}, ${failed} failed`)
    } else {
      toast.error(`Couldn't ${verb.replace(/ed$/, "")} ${plural(failed)}`)
    }
  }

  const archiveAll = () => runBulk("archive", (id) => patchThread(id, { isArchived: true }), { isArchived: true }, "archived")
  const starAll = () => runBulk("star", (id) => patchThread(id, { isStarred: true }), { isStarred: true }, "starred")
  const readAll = () => runBulk("read", (id) => patchThread(id, { isRead: true }), { isRead: true }, "marked as read")
  const trashAll = () => {
    if (!confirm(`Move ${plural(ids.length)} to trash?`)) return
    runBulk(
      "trash",
      async (id) => {
        const res = await fetch(`/api/threads/${id}`, { method: "DELETE" })
        if (!res.ok) throw new Error()
      },
      // Hide trashed threads from the list
      { isArchived: true },
      "moved to trash"
    )
  }

  const actions = [
    { key: "archive", label: "Archive", icon: Archive, onClick: archiveAll },
    { key: "star", label: "Star", icon: Star, onClick: starAll },
    { key: "read", label: "Mark read", icon: MailOpen, onClick: readAll },
    { key: "trash", label: "Trash", icon: Trash2, onClick: trashAll },
  ]

  return (
    <div className="relative flex items-center gap-3 rounded-xl bg-espresso px-4 py-2 shadow-[0_4px_16px_rgba(45,42,38,0.2)]">
      <span className="text-sm font-medium text-white whitespace-nowrap">
        {selectedIds.size} selected
      </span>

      <div className="mx-1 h-4 w-px bg-white/25" />

      <div className="flex items-center gap-0.5 overflow-x-auto">
        {actions.map(({ key, label, icon: Icon, onClick }) => (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            onClick={onClick}
            disabled={busy !== null}
            className="h-8 gap-1.5 text-white hover:bg-white/15 hover:text-white"
          >
            {busy === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>

      <div className="ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 w-8 p-0 text-white hover:bg-white/15 hover:text-white"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear selection</span>
        </Button>
      </div>
    </div>
  )
}
