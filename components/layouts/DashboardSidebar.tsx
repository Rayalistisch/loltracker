"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Swords,
  BarChart3,
  Users2,
  User,
  Settings,
  Target,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { PlayerProfile } from "@/types/domain"

const NAV_ITEMS = [
  { label: "Dashboard",     href: "/dashboard",         icon: LayoutDashboard },
  { label: "Sessions",      href: "/session/history",   icon: Swords          },
  { label: "Analytics",     href: "/analytics",         icon: BarChart3       },
  { label: "Accountability",href: "/accountability",    icon: Target          },
  { label: "Find Duo",      href: "/duo",               icon: Users2          },
  { label: "Profile",       href: "/profile",           icon: User            },
  { label: "Settings",      href: "/settings/account",  icon: Settings        },
]

interface DashboardSidebarProps {
  profile: PlayerProfile | null
}

export function DashboardSidebar({ profile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const displayName = profile?.displayName ?? profile?.username ?? "Summoner"
  const rankLabel   = profile?.currentRank ?? "Unranked"

  return (
    <aside
      className="flex flex-col w-64 h-full relative"
      style={{
        background: "rgba(10,12,18,0.85)",
        backdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(76,214,255,0.08)",
      }}
    >
      {/* Atmospheric glow */}
      <div
        className="absolute bottom-0 left-0 w-48 h-48 pointer-events-none -z-10"
        style={{ background: "radial-gradient(circle, rgba(76,214,255,0.04) 0%, transparent 70%)" }}
      />

      {/* ── Profile section ─────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 py-5"
      >
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded border-2 overflow-hidden shrink-0 flex items-center justify-center"
          style={{ borderColor: "rgba(76,214,255,0.25)", background: "rgba(30,31,37,0.8)" }}
        >
          {profile?.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={displayName}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src="/lol_tracker.png"
              alt="LoLTracker"
              width={28}
              height={28}
              className="object-contain"
              priority
            />
          )}
        </div>

        {/* Name + rank */}
        <div className="min-w-0">
          <p
            className="text-xs font-black tracking-widest uppercase truncate leading-tight"
            style={{ color: "#a4e6ff" }}
          >
            {displayName}
          </p>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mt-0.5 truncate">
            {rankLabel}
          </p>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-4 py-3 px-6 transition-all duration-200 border-l-4",
                isActive
                  ? "border-[#4cd6ff] bg-[rgba(76,214,255,0.07)] text-[#a4e6ff]"
                  : "border-transparent text-muted-foreground/40 hover:text-[#a4e6ff]/80 hover:bg-[rgba(76,214,255,0.04)]"
              )}
            >
              <Icon
                className="h-4 w-4 shrink-0"
                style={isActive ? { filter: "drop-shadow(0 0 4px rgba(76,214,255,0.5))" } : undefined}
              />
              <span className="text-xs font-black tracking-widest uppercase">
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ── Bottom: sign out + new session ──────────────────────────────── */}
      <div
        className="px-5 pb-6 pt-4 border-t space-y-3"
        style={{ borderColor: "rgba(76,214,255,0.08)" }}
      >
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full py-2 px-1 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span className="text-[9px] font-black uppercase tracking-widest">Sign Out</span>
        </button>

        <Link
          href="/session/new"
          className="block w-full py-3 text-center text-xs font-black tracking-widest uppercase transition-all hover:brightness-110"
          style={{
            background: "transparent",
            border: "1px solid rgba(76,214,255,0.35)",
            color: "#4cd6ff",
            boxShadow: "0 0 12px rgba(76,214,255,0.08)",
          }}
        >
          NEW SESSION
        </Link>
      </div>
    </aside>
  )
}
