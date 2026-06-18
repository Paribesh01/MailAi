"use client"

import { EmailCategory } from "@/types/email"
import { cn } from "@/lib/utils"

type Category = EmailCategory | "ALL"

const TABS: {
  value: Category
  label: string
  activeBadge: string
  inactiveBadge: string
}[] = [
  {
    value: "NEEDS_ATTENTION",
    label: "Needs Attention",
    activeBadge: "bg-coral-light text-coral",
    inactiveBadge: "bg-coral text-white",
  },
  {
    value: "CAN_WAIT",
    label: "Can Wait",
    activeBadge: "bg-sage-light text-sage",
    inactiveBadge: "bg-sage text-white",
  },
  {
    value: "IGNORE",
    label: "Ignore",
    activeBadge: "bg-taupe text-stone-warm",
    inactiveBadge: "bg-tan text-stone-warm",
  },
]

interface SplitTabsProps {
  active: Category
  onChange: (cat: Category) => void
  counts: Record<string, number>
}

export function SplitTabs({ active, onChange, counts }: SplitTabsProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-taupe bg-cream">
      {TABS.map(({ value, label, activeBadge, inactiveBadge }) => {
        const isActive = active === value
        const count = counts[value] ?? 0
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-[10px] transition-all duration-150 cursor-pointer",
              isActive
                ? "bg-white shadow-[0_1px_3px_rgba(45,42,38,0.08)] text-espresso font-semibold"
                : "text-stone-warm hover:text-espresso font-medium"
            )}
          >
            <span className="text-[14px] whitespace-nowrap">{label}</span>
            {count > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-medium",
                  isActive ? activeBadge : inactiveBadge
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
