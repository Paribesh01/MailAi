"use client"

import { EmailCategory } from "@/types/email"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type Category = EmailCategory | "ALL"

const TABS: { value: Category; label: string; description: string }[] = [
  { value: "NEEDS_ATTENTION", label: "Needs attention", description: "Requires your reply" },
  { value: "CAN_WAIT", label: "Can wait", description: "Low urgency" },
  { value: "IGNORE", label: "Ignore", description: "Noise filtered" },
]

interface SplitTabsProps {
  active: Category
  onChange: (cat: Category) => void
  counts: Record<string, number>
}

export function SplitTabs({ active, onChange, counts }: SplitTabsProps) {
  return (
    <div className="flex border-b px-2 gap-0.5">
      {TABS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            "relative flex items-center gap-1.5 px-3 py-2.5 text-sm transition-colors",
            active === value
              ? "text-foreground font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-t"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
          {counts[value] ? (
            <Badge variant={active === value ? "default" : "secondary"} className="h-4 px-1 text-[10px]">
              {counts[value]}
            </Badge>
          ) : null}
        </button>
      ))}
    </div>
  )
}
