"use client"

import { EmailCategory } from "@/types/email"
import { cn } from "@/lib/utils"

type Category = EmailCategory | "ALL"

const TABS: {
  value: Category
  label: string
  activeClass: string
  badgeClass: string
  dotClass: string
}[] = [
  {
    value: "NEEDS_ATTENTION",
    label: "Needs attention",
    activeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    badgeClass: "bg-rose-500 text-white",
    dotClass: "bg-rose-400",
  },
  {
    value: "CAN_WAIT",
    label: "Can wait",
    activeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    badgeClass: "bg-amber-500 text-white",
    dotClass: "bg-amber-400",
  },
  {
    value: "IGNORE",
    label: "Ignore",
    activeClass: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    badgeClass: "bg-slate-500 text-white",
    dotClass: "bg-slate-400",
  },
]

interface SplitTabsProps {
  active: Category
  onChange: (cat: Category) => void
  counts: Record<string, number>
}

export function SplitTabs({ active, onChange, counts }: SplitTabsProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2.5 border-b bg-gradient-to-r from-background to-muted/20">
      {TABS.map(({ value, label, activeClass, badgeClass, dotClass }) => {
        const isActive = active === value
        const count = counts[value] ?? 0
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border",
              isActive
                ? activeClass
                : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/50"
            )}
          >
            {isActive && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotClass)} />}
            {label}
            {count > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
                  isActive ? badgeClass : "bg-muted text-muted-foreground"
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
