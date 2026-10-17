import type { Thread } from "@/types/email"

type ThreadPatch = Partial<Pick<Thread, "isArchived" | "isStarred" | "isRead" | "category" | "isSnoozed">> & {
  snoozedUntil?: string | null
}

/** PATCH a thread; throws on network or HTTP errors so callers can roll back. */
export async function patchThread(id: string, updates: ThreadPatch) {
  const res = await fetch(`/api/threads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? `Request failed (${res.status})`)
  }
  return res.json()
}
