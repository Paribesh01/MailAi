"use client"

import { useEffect } from "react"

interface UseKeyboardShortcutsOptions {
  threads: Array<{ id: string }>
  selectedThread: string | null
  onSelectThread: (id: string | null) => void
  onArchive: (id: string) => void
  onStar: (id: string) => void
  onCompose: () => void
  onSearch: () => void
  onHelp?: () => void
  enabled?: boolean
}

export const KEYBOARD_SHORTCUTS: Array<[string, string]> = [
  ["j / k", "Next / previous email"],
  ["e", "Archive"],
  ["s", "Star / unstar"],
  ["c", "Compose"],
  ["/", "Search"],
  ["Esc", "Close email"],
  ["?", "Show shortcuts"],
]

export function useKeyboardShortcuts({
  threads,
  selectedThread,
  onSelectThread,
  onArchive,
  onStar,
  onCompose,
  onSearch,
  onHelp,
  enabled = true,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(event: KeyboardEvent): void {
      const target = event.target as HTMLElement

      // Leave browser/OS shortcuts alone (⌘C must copy, not open compose)
      if (event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented) return

      // Guard: skip if focus is in a form field, editable element, or an open dialog/menu
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable ||
        target.closest('[role="dialog"], [role="menu"], [role="listbox"]')
      ) {
        return
      }

      const key = event.key

      switch (key) {
        case "j": {
          // Select next thread
          if (threads.length === 0) break
          if (selectedThread === null) {
            onSelectThread(threads[0].id)
          } else {
            const currentIndex = threads.findIndex((t) => t.id === selectedThread)
            const nextIndex = currentIndex + 1
            if (nextIndex < threads.length) {
              onSelectThread(threads[nextIndex].id)
            }
          }
          break
        }

        case "k": {
          // Select previous thread
          if (threads.length === 0) break
          if (selectedThread === null) {
            onSelectThread(threads[threads.length - 1].id)
          } else {
            const currentIndex = threads.findIndex((t) => t.id === selectedThread)
            const prevIndex = currentIndex - 1
            if (prevIndex >= 0) {
              onSelectThread(threads[prevIndex].id)
            }
          }
          break
        }

        case "e": {
          // Archive currently selected thread
          if (selectedThread !== null) {
            onArchive(selectedThread)
          }
          break
        }

        case "s": {
          // Star/unstar currently selected thread
          if (selectedThread !== null) {
            onStar(selectedThread)
          }
          break
        }

        case "c":
        case "n": {
          // Compose new email
          onCompose()
          break
        }

        case "/": {
          // Focus search
          event.preventDefault()
          onSearch()
          break
        }

        case "Escape": {
          // Deselect thread
          if (selectedThread !== null) onSelectThread(null)
          break
        }

        case "?": {
          onHelp?.()
          break
        }

        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [enabled, threads, selectedThread, onSelectThread, onArchive, onStar, onCompose, onSearch, onHelp])
}
