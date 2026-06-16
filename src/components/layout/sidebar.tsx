"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { signOut } from "@/lib/auth-client"
import {
  Inbox, Star, Clock, Archive, Bell, Settings, PenSquare, Mail, BarChart2, LogOut, Send,
} from "lucide-react"
import { toast } from "sonner"

interface SidebarProps {
  user: { name: string; email: string; image?: string | null }
}

const NAV = [
  { href: "/inbox", icon: Inbox, label: "Inbox", color: "text-indigo-400" },
  { href: "/sent", icon: Send, label: "Sent", color: "text-sky-400" },
  { href: "/inbox?starred=true", icon: Star, label: "Starred", color: "text-amber-400" },
  { href: "/inbox?snoozed=true", icon: Clock, label: "Snoozed", color: "text-violet-400" },
  { href: "/inbox?archived=true", icon: Archive, label: "Archived", color: "text-slate-400" },
  { href: "/inbox?followups=true", icon: Bell, label: "Follow-ups", color: "text-rose-400" },
  { href: "/stats", icon: BarChart2, label: "Analytics", color: "text-teal-400" },
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
    <aside className="w-14 flex flex-col items-center py-3 gap-1 border-r shrink-0 bg-gradient-to-b from-slate-900 to-slate-950 dark:from-slate-900 dark:to-slate-950">
      {/* Logo */}
      <Link
        href="/inbox"
        className="flex items-center justify-center w-9 h-9 rounded-xl mb-3 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20"
      >
        <Mail className="w-4 h-4 text-white" />
      </Link>

      {/* Compose */}
      <Tooltip>
        <TooltipTrigger render={
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-xl text-indigo-400 hover:bg-white/10 hover:text-indigo-300"
            onClick={() => router.push("/inbox?compose=true")}
          >
            <PenSquare className="w-4 h-4" />
          </Button>
        } />
        <TooltipContent side="right">Compose</TooltipContent>
      </Tooltip>

      <div className="w-6 h-px bg-white/10 my-1" />

      {/* Nav */}
      {NAV.map(({ href, icon: Icon, label, color }) => {
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
                  "flex items-center justify-center w-9 h-9 rounded-xl transition-all",
                  active
                    ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/25"
                    : cn("hover:bg-white/10", color)
                )}
              >
                <Icon className="w-4 h-4" />
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
              "flex items-center justify-center w-9 h-9 rounded-xl transition-all",
              pathname === "/settings"
                ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/25"
                : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
            )}
          >
            <Settings className="w-4 h-4" />
          </Link>
        } />
        <TooltipContent side="right">Settings</TooltipContent>
      </Tooltip>

      {/* User avatar with sign out */}
      <Tooltip>
        <TooltipTrigger render={
          <button onClick={handleSignOut} className="relative group mt-1">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="text-xs bg-slate-700 text-slate-200">{initials}</AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
              <LogOut className="w-3 h-3 text-white" />
            </span>
          </button>
        } />
        <TooltipContent side="right">Sign out ({user.email})</TooltipContent>
      </Tooltip>
    </aside>
  )
}
