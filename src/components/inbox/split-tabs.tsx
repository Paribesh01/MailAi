"use client"

import { useEffect, useRef, useState } from "react"
import { EmailCategory } from "@/types/email"
import { cn } from "@/lib/utils"
import { Plus, X, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

type Category = EmailCategory | "ALL"

export interface CustomFilter {
  id: string
  name: string
  color: string
  conditions: FilterConditions
}

export interface FilterConditions {
  aiPrompt?: string
  // kept for backwards compatibility
  senderContains?: string
  subjectContains?: string
  category?: EmailCategory
  accountEmail?: string
  isUnread?: boolean
  isStarred?: boolean
  hasFollowUp?: boolean
}

const BUILT_IN_TABS: { value: Category; label: string; activeBadge: string; inactiveBadge: string }[] = [
  { value: "ALL", label: "All", activeBadge: "bg-taupe text-stone-warm", inactiveBadge: "bg-espresso text-white" },
  { value: "NEEDS_ATTENTION", label: "Needs Attention", activeBadge: "bg-coral-light text-coral", inactiveBadge: "bg-coral text-white" },
  { value: "CAN_WAIT", label: "Can Wait", activeBadge: "bg-sage-light text-sage", inactiveBadge: "bg-sage text-white" },
  { value: "IGNORE", label: "Ignore", activeBadge: "bg-taupe text-stone-warm", inactiveBadge: "bg-tan text-stone-warm" },
]

const COLORS = [
  "#6b7db3", "#e0745a", "#7a9e7e", "#c4a97d",
  "#9b7bb8", "#5b9bd5", "#d4845a", "#6bab9e",
]

interface SplitTabsProps {
  active: Category | string
  onChange: (cat: Category | string, customFilter?: CustomFilter) => void
  counts: Record<string, number>
  linkedAccountEmails?: string[]
}

export function SplitTabs({ active, onChange, counts, linkedAccountEmails = [] }: SplitTabsProps) {
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([])
  const [showPopover, setShowPopover] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({ name: "", color: COLORS[0], aiPrompt: "" })

  useEffect(() => {
    fetch("/api/custom-filters")
      .then((r) => r.json())
      .then((d) => setCustomFilters(d.filters ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!showPopover) return
    function handle(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false)
      }
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [showPopover])

  async function saveFilter() {
    if (!form.name.trim() || !form.aiPrompt.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/custom-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          color: form.color,
          conditions: { aiPrompt: form.aiPrompt.trim() },
        }),
      })
      const created: CustomFilter = await res.json()
      setCustomFilters((prev) => [...prev, created])
      setShowPopover(false)
      setForm({ name: "", color: COLORS[0], aiPrompt: "" })
      toast.success(`Filter "${created.name}" created`)
    } catch {
      toast.error("Failed to create filter")
    } finally {
      setSaving(false)
    }
  }

  async function removeFilter(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setRemoving(id)
    try {
      await fetch("/api/custom-filters", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      setCustomFilters((prev) => prev.filter((f) => f.id !== id))
      if (active === id) onChange("ALL")
    } catch {
      toast.error("Failed to delete filter")
    } finally {
      setRemoving(null)
    }
  }

  return (
    // Outer wrapper is relative so the popover escapes the scroll container
    <div className="relative border-b border-taupe bg-cream">
      {/* Scrollable tab row */}
      <div className="flex items-center gap-1 px-4 py-2.5 overflow-x-auto scrollbar-none">
        {BUILT_IN_TABS.map(({ value, label, activeBadge, inactiveBadge }) => {
          const isActive = active === value
          const count = counts[value] ?? 0
          return (
            <button
              key={value}
              onClick={() => onChange(value)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-[10px] transition-all duration-150 cursor-pointer shrink-0",
                isActive
                  ? "bg-white shadow-[0_1px_3px_rgba(45,42,38,0.08)] text-espresso font-semibold"
                  : "text-stone-warm hover:text-espresso font-medium"
              )}
            >
              <span className="text-[14px] whitespace-nowrap">{label}</span>
              {count > 0 && (
                <span className={cn(
                  "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-medium",
                  isActive ? activeBadge : inactiveBadge
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}

        {customFilters.length > 0 && <div className="w-px h-5 bg-taupe mx-1 shrink-0" />}

        {customFilters.map((cf) => {
          const isActive = active === cf.id
          return (
            <button
              key={cf.id}
              onClick={() => onChange(cf.id, cf)}
              className={cn(
                "group flex items-center gap-1.5 px-3 py-2 rounded-[10px] transition-all duration-150 cursor-pointer shrink-0",
                isActive
                  ? "bg-white shadow-[0_1px_3px_rgba(45,42,38,0.08)] text-espresso font-semibold"
                  : "text-stone-warm hover:text-espresso font-medium"
              )}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cf.color }} />
              <span className="text-[14px] whitespace-nowrap">{cf.name}</span>
              {removing === cf.id ? (
                <Loader2 className="w-3 h-3 animate-spin ml-0.5 text-stone-warm" />
              ) : (
                <span
                  onClick={(e) => removeFilter(cf.id, e)}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-taupe ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-2.5 h-2.5 text-stone-warm" />
                </span>
              )}
            </button>
          )
        })}

        {/* Add button — inside scroll area so it's always at the end of the tab list */}
        <button
          onClick={() => setShowPopover((v) => !v)}
          className={cn(
            "ml-1 flex items-center justify-center w-7 h-7 rounded-full border border-taupe transition-colors shrink-0",
            showPopover ? "bg-taupe text-espresso" : "text-stone-warm hover:bg-taupe/60 hover:text-espresso"
          )}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Popover — positioned on the OUTER relative wrapper, not inside overflow-x-auto */}
      {showPopover && (
        <div
          ref={popoverRef}
          className="absolute left-4 top-full mt-1 w-80 bg-white rounded-2xl border border-taupe shadow-[0_8px_32px_rgba(45,42,38,0.14)] z-50 p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-blue" />
            <p className="text-[14px] font-semibold text-espresso">New custom filter</p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-stone-warm uppercase tracking-wide">Filter name</label>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Job offers, Finance, Work"
              className="w-full h-9 px-3 text-sm rounded-xl border border-taupe bg-cream focus:outline-none focus:ring-2 focus:ring-slate-blue/20 text-espresso placeholder:text-stone-warm/40"
            />
          </div>

          {/* AI Prompt */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-stone-warm uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-slate-blue" /> AI filter condition
            </label>
            <textarea
              value={form.aiPrompt}
              onChange={(e) => setForm((p) => ({ ...p, aiPrompt: e.target.value }))}
              placeholder="Describe what emails belong here, e.g. 'emails about job opportunities or interview invitations' or 'messages from my bank or about payments'"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-xl border border-taupe bg-cream focus:outline-none focus:ring-2 focus:ring-slate-blue/20 text-espresso placeholder:text-stone-warm/40 resize-none leading-relaxed"
            />
            <p className="text-[11px] text-stone-warm/70">AI reads each email and decides if it matches your description.</p>
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-stone-warm uppercase tracking-wide">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  className={cn(
                    "w-6 h-6 rounded-full transition-transform",
                    form.color === c ? "ring-2 ring-offset-2 scale-110" : "hover:scale-110"
                  )}
                  style={{ backgroundColor: c, outlineColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={saveFilter}
              disabled={saving || !form.name.trim() || !form.aiPrompt.trim()}
              className="flex-1 h-9 rounded-xl bg-espresso text-white text-xs font-semibold hover:bg-espresso/85 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {saving ? "Creating…" : "Create filter"}
            </button>
            <button
              onClick={() => setShowPopover(false)}
              className="h-9 px-4 rounded-xl border border-taupe text-xs text-stone-warm hover:border-stone-warm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
