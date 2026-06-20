"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { signOut } from "@/lib/auth-client"
import {
  Inbox, Star, Clock, Archive, Bell, Settings, PenSquare, BarChart2, LogOut, Send, Sparkles,
  Crown, MailX, Trash2, ShieldOff,
} from "lucide-react"
import { toast } from "sonner"

interface SidebarProps {
  user: { name: string; email: string; image?: string | null }
}

const NAV = [
  { href: "/inbox", icon: Inbox, label: "Inbox" },
  { href: "/sent", icon: Send, label: "Sent" },
  { href: "/inbox?starred=true", icon: Star, label: "Starred" },
  { href: "/inbox?snoozed=true", icon: Clock, label: "Snoozed" },
  { href: "/inbox?archived=true", icon: Archive, label: "Archived" },
  { href: "/inbox?followups=true", icon: Bell, label: "Follow-ups" },
  { href: "/stats", icon: BarChart2, label: "Analytics" },
  { href: "/unsubscribe", icon: MailX, label: "Unsubscribe Manager" },
  { href: "/spam", icon: ShieldOff, label: "Spam" },
  { href: "/trash", icon: Trash2, label: "Trash" },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push("/login")
    toast.success("Signed out")
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <aside className="w-14 flex flex-col items-center py-4 gap-1 border-r border-taupe shrink-0 bg-cream">
      {/* Logo */}
      <Link
        href="/inbox"
        className="flex items-center justify-center w-8 h-8 rounded-xl mb-5 bg-coral/10"
      >
        <Sparkles className="w-4 h-4 text-coral" />
      </Link>

      {/* Compose */}
      <Tooltip>
        <TooltipTrigger render={
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-full text-stone-warm hover:bg-sand-light/60"
            onClick={() => router.push("/inbox?compose=true")}
          >
            <PenSquare className="w-[18px] h-[18px]" />
          </Button>
        } />
        <TooltipContent side="right">Compose</TooltipContent>
      </Tooltip>

      <div className="w-6 h-px bg-taupe my-1.5" />

      {/* Nav */}
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = href === "/inbox"
          ? pathname === "/inbox" && (typeof window !== "undefined" ? !window.location.search : true)
          : href.startsWith("/inbox?")
          ? pathname + (typeof window !== "undefined" ? window.location.search : "") === href
          : pathname === href

        return (
          <Tooltip key={label}>
            <TooltipTrigger render={
              <Link
                href={href}
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-150",
                  active
                    ? "bg-sand-light text-espresso"
                    : "text-stone-warm hover:bg-sand-light/50"
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
              </Link>
            } />
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        )
      })}

      <div className="flex-1" />

      {/* Settings */}
      <Tooltip>
        <TooltipTrigger render={
          <Link
            href="/settings"
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-150",
              pathname === "/settings"
                ? "bg-sand-light text-espresso"
                : "text-stone-warm hover:bg-sand-light/50"
            )}
          >
            <Settings className="w-[18px] h-[18px]" />
          </Link>
        } />
        <TooltipContent side="right">Settings</TooltipContent>
      </Tooltip>

      {/* User avatar */}
      <Tooltip>
        <TooltipTrigger render={
          <button onClick={handleSignOut} className="relative group mt-2">
            <div className="w-8 h-8 rounded-full bg-slate-blue flex items-center justify-center">
              {user.image ? (
                <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-white text-[11px] font-semibold">{initials}</span>
              )}
            </div>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-espresso/60 opacity-0 group-hover:opacity-100 transition-opacity">
              <LogOut className="w-3 h-3 text-white" />
            </span>
          </button>
        } />
        <TooltipContent side="right">Sign out ({user.email})</TooltipContent>
      </Tooltip>
    </aside>
  )
}
