"use client"

import { useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  value: string
  onChange: (q: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div
      className={cn(
        "flex items-center gap-2 flex-1 h-9 px-3 rounded-lg border bg-muted/50 transition-colors",
        focused && "bg-background border-primary/50 ring-1 ring-primary/20"
      )}
      onClick={() => ref.current?.focus()}
    >
      <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search emails..."
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      {value && (
        <button onClick={() => onChange("")} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
