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
  enabled?: boolean
}

export function useKeyboardShortcuts({
  threads,
  selectedThread,
  onSelectThread,
  onArchive,
  onStar,
  onCompose,
  onSearch,
  enabled = true,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(event: KeyboardEvent): void {
      const target = event.target as HTMLElement

      // Guard: skip if focus is in an input, textarea, or contentEditable element
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
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
          onSelectThread(null)
          break
        }

        case "?": {
          // Show shortcuts help (shift+/)
          console.log(
            "Keyboard shortcuts:\n" +
              "  j         — Select next thread\n" +
              "  k         — Select previous thread\n" +
              "  e         — Archive selected thread\n" +
              "  s         — Star/unstar selected thread\n" +
              "  c / n     — Compose new email\n" +
              "  /         — Focus search\n" +
              "  Escape    — Deselect thread\n" +
              "  ?         — Show this help"
          )
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
  }, [enabled, threads, selectedThread, onSelectThread, onArchive, onStar, onCompose, onSearch])
}
