"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Swords,
  BarChart3,
  Users2,
  User,
  Settings,
  Brain,
  Target,
  LogOut,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import type { PlayerProfile } from "@/types/domain"

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Sessions",
    href: "/session/history",
    icon: Swords,
    subItems: [
      { label: "Start Session", href: "/session/new" },
      { label: "History", href: "/session/history" },
    ],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    subItems: [
      { label: "Overview", href: "/analytics" },
      { label: "Tilt Analysis", href: "/analytics/tilt" },
    ],
  },
  {
    label: "Accountability",
    href: "/accountability",
    icon: Target,
  },
  {
    label: "Find Duo",
    href: "/duo",
    icon: Users2,
    subItems: [
      { label: "Duo Hub", href: "/duo" },
      { label: "Find Partner", href: "/duo/find" },
      { label: "Requests", href: "/duo/requests" },
      { label: "Saved", href: "/duo/saved" },
    ],
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    label: "Settings",
    href: "/settings/account",
    icon: Settings,
  },
]

interface DashboardSidebarProps {
  profile: PlayerProfile | null
}

export function DashboardSidebar({ profile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="flex flex-col w-64 h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
        <Image
          src="/lol_tracker.png"
          alt="Loltracker"
          width={50}
          height={50}
          className="object-contain shrink-0"
          priority
        />
        <span className="text-lg font-bold tracking-tight text-sidebar-foreground">LoLTracker</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.subItems && (
                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      isActive && "rotate-90"
                    )}
                  />
                )}
              </Link>

              {/* Sub-items shown when parent is active */}
              {isActive && item.subItems && (
                <div className="ml-7 mt-0.5 space-y-0.5">
                  {item.subItems.map((sub) => {
                    const isSubActive = pathname === sub.href
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={cn(
                          "block px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                          isSubActive
                            ? "text-sidebar-primary"
                            : "text-sidebar-foreground hover:text-sidebar-foreground"
                        )}
                      >
                        {sub.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-3">
        {profile && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile.displayName}
              </p>
              <p className="text-xs text-sidebar-foreground truncate">
                {profile.currentRank ?? "Unranked"}
              </p>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/60"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
