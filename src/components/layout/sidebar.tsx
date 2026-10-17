"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { signOut } from "@/lib/auth-client"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Inbox, Star, Clock, Archive, Bell, Settings, PenSquare, BarChart2, LogOut, Send, Sparkles,
  MailX, Trash2, ShieldOff, CalendarClock, Users,
} from "lucide-react"
import { toast } from "sonner"

interface SidebarProps {
  user: { name: string; email: string; image?: string | null }
}

// Grouped so related destinations sit together, with a divider between groups
const NAV_GROUPS = [
  [
    { href: "/inbox", icon: Inbox, label: "Inbox" },
    { href: "/inbox?starred=true", icon: Star, label: "Starred" },
    { href: "/inbox?snoozed=true", icon: Clock, label: "Snoozed" },
    { href: "/inbox?followups=true", icon: Bell, label: "Follow-ups" },
    { href: "/sent", icon: Send, label: "Sent" },
    { href: "/scheduled", icon: CalendarClock, label: "Scheduled" },
    { href: "/inbox?archived=true", icon: Archive, label: "Archived" },
  ],
  [
    { href: "/spam", icon: ShieldOff, label: "Spam" },
    { href: "/trash", icon: Trash2, label: "Trash" },
  ],
  [
    { href: "/merge", icon: Users, label: "Mail Merge" },
    { href: "/unsubscribe", icon: MailX, label: "Unsubscribe Manager" },
    { href: "/stats", icon: BarChart2, label: "Analytics" },
  ],
]

function isActive(href: string, pathname: string, search: string) {
  const [path, query = ""] = href.split("?")
  if (path !== pathname) return false
  // "/inbox" is only active with no view filter; "/inbox?starred=true" needs that exact filter
  if (path === "/inbox") {
    const view = ["starred", "snoozed", "archived", "followups"].find((k) => new URLSearchParams(search).get(k) === "true")
    return query ? query === `${view}=true` : !view
  }
  return true
}

function NavLinks() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()

  return (
    <>
      {NAV_GROUPS.map((group, gi) => (
        <div key={gi} className="flex flex-col items-center gap-1 w-full">
          {gi > 0 && <div className="w-5 h-px bg-taupe my-1" />}
          {group.map(({ href, icon: Icon, label }) => {
            const active = isActive(href, pathname, search)
            return (
              <Tooltip key={label}>
                <TooltipTrigger render={
                  <Link
                    href={href}
                    aria-label={label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-150 shrink-0",
                      active
                        ? "bg-sand-light text-espresso"
                        : "text-stone-warm hover:bg-sand-light/50 hover:text-espresso"
                    )}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </Link>
                } />
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      ))}
    </>
  )
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    try {
      await signOut()
      router.push("/login")
      toast.success("Signed out")
    } catch {
      toast.error("Couldn't sign out. Try again.")
    }
  }

  const initials = (user.name || user.email)
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
            aria-label="Compose"
          >
            <PenSquare className="w-[18px] h-[18px]" />
          </Button>
        } />
        <TooltipContent side="right">Compose</TooltipContent>
      </Tooltip>

      <div className="w-6 h-px bg-taupe my-1.5" />

      {/* Nav — scrollable so all items remain reachable */}
      <nav aria-label="Main" className="flex-1 flex flex-col items-center gap-1 overflow-y-auto w-full px-2 scrollbar-none">
        <Suspense fallback={null}>
          <NavLinks />
        </Suspense>
      </nav>

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

      {/* Account menu */}
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <button aria-label="Account" className="mt-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand/50">
            <div className="w-8 h-8 rounded-full bg-slate-blue flex items-center justify-center overflow-hidden">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-white text-[11px] font-semibold">{initials}</span>
              )}
            </div>
          </button>
        } />
        <DropdownMenuContent side="right" align="end" className="min-w-52">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium text-espresso truncate">{user.name}</p>
            <p className="text-xs text-stone-warm truncate">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings className="w-3.5 h-3.5 mr-2" /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut} className="text-coral">
            <LogOut className="w-3.5 h-3.5 mr-2" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </aside>
  )
}
