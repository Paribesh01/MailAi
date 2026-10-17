"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
}

const MIN_WIDTH = 300
const DEFAULT_WIDTH = 400
const WIDTH_KEY = "chat-panel-width"
const OPEN_KEY = "chat-panel-open"

// Leave the mail pane at least this much room
const maxWidth = () => Math.max(MIN_WIDTH, Math.min(900, window.innerWidth * 0.6))
const clampWidth = (w: number) => Math.round(Math.min(Math.max(w, MIN_WIDTH), maxWidth()))

function readStorage(key: string) {
  try { return localStorage.getItem(key) } catch { return null }
}
function writeStorage(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch {}
}

const QUICK_PROMPTS = [
  "What's new in my inbox today?",
  "Any replies to my sent emails?",
  "What needs my attention right now?",
]

export function ChatAssistant() {
  const [open, setOpen] = useState(false)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [resizing, setResizing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (messages.length) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Restore panel state after mount to avoid a hydration mismatch
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const savedWidth = Number(readStorage(WIDTH_KEY))
    if (savedWidth) setWidth(clampWidth(savedWidth))
    if (readStorage(OPEN_KEY) === "1") setOpen(true)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    writeStorage(OPEN_KEY, open ? "1" : "0")
  }, [open])

  useEffect(() => {
    const onResize = () => setWidth((w) => clampWidth(w))
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const updateWidth = useCallback((w: number) => {
    const next = clampWidth(w)
    setWidth(next)
    writeStorage(WIDTH_KEY, String(next))
  }, [])

  function startResize(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = width
    setResizing(true)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    // Panel sits on the right, so dragging left widens it
    const onMove = (ev: PointerEvent) => updateWidth(startWidth + (startX - ev.clientX))
    const onUp = () => {
      setResizing(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  function handleResizeKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") { e.preventDefault(); updateWidth(width + 24) }
    if (e.key === "ArrowRight") { e.preventDefault(); updateWidth(width - 24) }
  }

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: "user", content: trimmed }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: messages }),
      })
      const data = await res.json()
      setMessages([
        ...newHistory,
        { role: "assistant", content: data.reply ?? data.error ?? "Something went wrong." },
      ])
    } catch {
      setMessages([...newHistory, { role: "assistant", content: "Something went wrong. Try again." }])
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full flex items-center justify-center",
          "bg-espresso hover:bg-espresso/85 shadow-[0_4px_16px_rgba(45,42,38,0.25)]",
          "transition-all duration-200"
        )}
        title="Inbox Assistant"
      >
        <MessageCircle className="w-5 h-5 text-white" />
      </button>
    )
  }

  return (
    <aside
      style={{ width }}
      className="relative h-full shrink-0 flex flex-col overflow-hidden border-l border-taupe bg-white"
    >
      {/* Resize handle */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize chat panel"
        aria-valuenow={width}
        tabIndex={0}
        onPointerDown={startResize}
        onKeyDown={handleResizeKey}
        onDoubleClick={() => updateWidth(DEFAULT_WIDTH)}
        title="Drag to resize · double-click to reset"
        className="group absolute inset-y-0 left-0 z-10 w-1.5 cursor-col-resize focus:outline-none"
      >
        <div
          className={cn(
            "h-full w-0.5 transition-colors group-hover:bg-coral/60 group-focus-visible:bg-coral",
            resizing && "bg-coral"
          )}
        />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-taupe bg-cream shrink-0">
        <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-coral" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-espresso leading-none">Inbox Assistant</p>
          <p className="text-[10px] text-stone-warm mt-0.5">Ask anything about your emails</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-[10px] text-stone-warm hover:text-espresso transition-colors mr-1"
          >
            Clear
          </button>
        )}
        <button
          onClick={() => setOpen(false)}
          className="text-stone-warm hover:text-espresso transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-cream/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 px-2">
            <div className="w-12 h-12 rounded-2xl bg-coral/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-coral" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-espresso">What can I help with?</p>
              <p className="text-xs text-stone-warm mt-1">I know about your inbox, replies, and priorities</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-taupe bg-white hover:bg-sand-light/40 hover:border-sand text-stone-warm hover:text-espresso transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-coral/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-coral" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-espresso text-white rounded-br-sm"
                      : "bg-white text-espresso rounded-bl-sm border border-taupe shadow-[0_1px_3px_rgba(45,42,38,0.06)]"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6 rounded-full bg-coral/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3 text-coral" />
                </div>
                <div className="bg-white border border-taupe rounded-2xl rounded-bl-sm px-3 py-2.5 shadow-[0_1px_3px_rgba(45,42,38,0.06)]">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-warm/40 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-warm/40 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-warm/40 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-3 pb-3 shrink-0 bg-white border-t border-taupe pt-3">
        <div className="flex items-end gap-2 rounded-xl border border-taupe bg-cream px-3 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder="Ask about your inbox..."
            className="flex-1 border-0 bg-transparent resize-none text-xs text-espresso placeholder:text-tan focus:outline-none focus:ring-0 min-h-[28px] max-h-[80px] leading-relaxed"
            rows={1}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-lg bg-espresso hover:bg-espresso/85 flex items-center justify-center shrink-0 disabled:opacity-40 transition-colors"
          >
            {loading ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Send className="w-3 h-3 text-white" />}
          </button>
        </div>
        <p className="text-[10px] text-stone-warm/50 text-center mt-1.5">Enter to send · Shift+Enter for new line</p>
      </div>
    </aside>
  )
}
