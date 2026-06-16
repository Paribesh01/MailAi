"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { signOut } from "@/lib/auth-client"
import {
  Inbox, Star, Clock, Archive, Bell, Settings, PenSquare, LogOut, Mail,
} from "lucide-react"
import { toast } from "sonner"

interface SidebarProps {
  user: { name: string; email: string; image?: string | null }
}

const NAV = [
  { href: "/inbox", icon: Inbox, label: "Inbox" },
  { href: "/inbox?starred=true", icon: Star, label: "Starred" },
  { href: "/inbox?snoozed=true", icon: Clock, label: "Snoozed" },
  { href: "/inbox?archived=true", icon: Archive, label: "Archived" },
  { href: "/inbox?followups=true", icon: Bell, label: "Follow-ups" },
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
    <aside className="w-14 flex flex-col items-center py-3 gap-1 border-r bg-card shrink-0">
      {/* Logo */}
      <Link href="/inbox" className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 mb-3">
        <Mail className="w-4 h-4 text-primary" />
      </Link>

      {/* Compose */}
      <Tooltip>
        <TooltipTrigger render={
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-xl text-primary hover:bg-primary/10"
            onClick={() => router.push("/inbox?compose=true")}
          >
            <PenSquare className="w-4 h-4" />
          </Button>
        } />
        <TooltipContent side="right">Compose</TooltipContent>
      </Tooltip>

      <div className="w-6 h-px bg-border my-1" />

      {/* Nav */}
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = pathname === "/inbox" && href === "/inbox"
          ? true
          : pathname + (typeof window !== "undefined" ? window.location.search : "") === href
        return (
          <Tooltip key={label}>
            <TooltipTrigger render={
              <Link
                href={href}
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-xl transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
              "flex items-center justify-center w-9 h-9 rounded-xl transition-colors",
              pathname === "/settings"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <LogOut className="w-3 h-3 text-white" />
            </span>
          </button>
        } />
        <TooltipContent side="right">Sign out ({user.email})</TooltipContent>
      </Tooltip>
    </aside>
  )
}
