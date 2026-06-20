"use client"

import { useEffect, useRef, useState } from "react"
import { EmailCategory } from "@/types/email"
import { cn } from "@/lib/utils"
import { Plus, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Category = EmailCategory | "ALL"

export interface CustomFilter {
  id: string
  name: string
  color: string
  conditions: FilterConditions
}

export interface FilterConditions {
  senderContains?: string
  subjectContains?: string
  bodyContains?: string
  category?: EmailCategory
  accountEmail?: string
  isUnread?: boolean
  isStarred?: boolean
  hasFollowUp?: boolean
}

const BUILT_IN_TABS: { value: Category; label: string; activeBadge: string; inactiveBadge: string }[] = [
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

  const [form, setForm] = useState<{
    name: string
    color: string
    conditions: FilterConditions
  }>({ name: "", color: COLORS[0], conditions: {} })

  useEffect(() => {
    fetch("/api/custom-filters")
      .then((r) => r.json())
      .then((d) => setCustomFilters(d.filters ?? []))
      .catch(() => {})
  }, [])

  // Close popover on outside click
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
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/custom-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, color: form.color, conditions: form.conditions }),
      })
      const created: CustomFilter = await res.json()
      setCustomFilters((prev) => [...prev, created])
      setShowPopover(false)
      setForm({ name: "", color: COLORS[0], conditions: {} })
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
      if (active === id) onChange("NEEDS_ATTENTION")
    } catch {
      toast.error("Failed to delete filter")
    } finally {
      setRemoving(null)
    }
  }

  function setCondition<K extends keyof FilterConditions>(key: K, value: FilterConditions[K] | "") {
    setForm((prev) => {
      const next = { ...prev.conditions }
      if (value === "" || value === false || value === undefined) {
        delete next[key]
      } else {
        next[key] = value as FilterConditions[K]
      }
      return { ...prev, conditions: next }
    })
  }

  return (
    <div className="flex items-center gap-1 px-4 py-3 border-b border-taupe bg-cream overflow-x-auto scrollbar-none">
      {/* Built-in tabs */}
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

      {/* Divider before custom filters */}
      {customFilters.length > 0 && (
        <div className="w-px h-5 bg-taupe mx-1 shrink-0" />
      )}

      {/* Custom filter tabs */}
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
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: cf.color }}
            />
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

      {/* Add filter button + popover */}
      <div className="relative ml-1 shrink-0" ref={popoverRef}>
        <button
          onClick={() => setShowPopover((v) => !v)}
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-full border border-taupe transition-colors",
            showPopover ? "bg-taupe text-espresso" : "text-stone-warm hover:bg-taupe/60 hover:text-espresso"
          )}
          title="Add custom filter"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {showPopover && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl border border-taupe shadow-[0_8px_32px_rgba(45,42,38,0.12)] z-50 p-4 space-y-3">
            <p className="text-[13px] font-semibold text-espresso">New custom filter</p>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-stone-warm uppercase tracking-wide">Name</label>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") saveFilter() }}
                placeholder="e.g. Finance, Work, Newsletters…"
                className="w-full h-8 px-2.5 text-sm rounded-lg border border-taupe bg-cream focus:outline-none focus:ring-1 focus:ring-slate-blue/40 text-espresso placeholder:text-stone-warm/50"
              />
            </div>

            {/* Color */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-stone-warm uppercase tracking-wide">Color</label>
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((p) => ({ ...p, color: c }))}
                    className={cn(
                      "w-5 h-5 rounded-full transition-transform",
                      form.color === c ? "ring-2 ring-offset-1 scale-110" : "hover:scale-110"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="w-full h-px bg-taupe" />
            <p className="text-[11px] font-medium text-stone-warm uppercase tracking-wide">Conditions <span className="normal-case font-normal">(all optional)</span></p>

            {/* Sender contains */}
            <ConditionInput
              label="Sender contains"
              value={form.conditions.senderContains ?? ""}
              onChange={(v) => setCondition("senderContains", v)}
              placeholder="e.g. bank.com, boss@"
            />

            {/* Subject contains */}
            <ConditionInput
              label="Subject contains"
              value={form.conditions.subjectContains ?? ""}
              onChange={(v) => setCondition("subjectContains", v)}
              placeholder="e.g. invoice, meeting"
            />

            {/* Category */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-stone-warm uppercase tracking-wide">Category</label>
              <select
                value={form.conditions.category ?? ""}
                onChange={(e) => setCondition("category", e.target.value as EmailCategory | "")}
                className="w-full h-8 px-2 text-sm rounded-lg border border-taupe bg-cream focus:outline-none text-espresso"
              >
                <option value="">Any</option>
                <option value="NEEDS_ATTENTION">Needs Attention</option>
                <option value="CAN_WAIT">Can Wait</option>
                <option value="IGNORE">Ignore</option>
              </select>
            </div>

            {/* Account (only if linked accounts exist) */}
            {linkedAccountEmails.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-warm uppercase tracking-wide">Account</label>
                <select
                  value={form.conditions.accountEmail ?? ""}
                  onChange={(e) => setCondition("accountEmail", e.target.value)}
                  className="w-full h-8 px-2 text-sm rounded-lg border border-taupe bg-cream focus:outline-none text-espresso"
                >
                  <option value="">Any account</option>
                  <option value="__primary__">Primary account</option>
                  {linkedAccountEmails.map((email) => (
                    <option key={email} value={email}>{email}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Boolean toggles */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {([
                ["isUnread", "Unread only"],
                ["isStarred", "Starred only"],
                ["hasFollowUp", "Has follow-up"],
              ] as [keyof FilterConditions, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form.conditions[key]}
                    onChange={(e) => setCondition(key, e.target.checked || undefined)}
                    className="w-3.5 h-3.5 rounded accent-slate-blue"
                  />
                  <span className="text-xs text-espresso">{label}</span>
                </label>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveFilter}
                disabled={saving || !form.name.trim()}
                className="flex-1 h-8 rounded-lg bg-espresso text-white text-xs font-semibold hover:bg-espresso/85 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {saving ? "Creating…" : "Create filter"}
              </button>
              <button
                onClick={() => setShowPopover(false)}
                className="h-8 px-3 rounded-lg border border-taupe text-xs text-stone-warm hover:border-stone-warm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ConditionInput({ label, value, onChange, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-stone-warm uppercase tracking-wide">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 px-2.5 text-sm rounded-lg border border-taupe bg-cream focus:outline-none focus:ring-1 focus:ring-slate-blue/40 text-espresso placeholder:text-stone-warm/50"
      />
    </div>
  )
}
