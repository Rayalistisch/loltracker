"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Plus, User, Settings, LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import type { PlayerProfile } from "@/types/domain"

interface DashboardTopbarProps {
  profile: PlayerProfile | null
  onMobileMenuOpen?: () => void
}

export function DashboardTopbar({ profile, onMobileMenuOpen }: DashboardTopbarProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const initials = profile?.displayName
    ? profile.displayName.slice(0, 2).toUpperCase()
    : "LT"

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-sm">
      {/* Mobile menu button */}
      <button
        className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
        onClick={onMobileMenuOpen}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden md:block" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Quick start session */}
        <Link
          href="/session/new"
          className="hidden md:inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Start Session
        </Link>

        {/* Notifications placeholder */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
          >
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-medium">{profile?.displayName ?? "Player"}</p>
              <p className="text-xs text-muted-foreground font-normal">{profile?.currentRank ?? "Unranked"}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings/account")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
