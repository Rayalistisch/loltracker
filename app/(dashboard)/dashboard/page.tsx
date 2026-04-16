import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import {
  Swords, Target, Users2, Flame, Plus,
  AlertTriangle, BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MOCK_TILT_ANALYSIS } from "@/lib/utils/mock-data"
import { getRecentSessions } from "@/services/session.service"
import { SessionCard } from "@/components/features/session/SessionCard"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("player_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profile && !profile.onboarding_completed) redirect("/onboarding")

  const recentSessions = await getRecentSessions(user.id, 8)
  const tiltAnalysis = MOCK_TILT_ANALYSIS

  const totalGames  = recentSessions.reduce((s, x) => s + (x.actualGames ?? 0), 0)
  const totalWins   = recentSessions.reduce((s, x) => s + (x.gamesWon ?? 0), 0)
  const totalLosses = recentSessions.reduce((s, x) => s + (x.gamesLost ?? 0), 0)
  const overallWR = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : null

  const tiltConfig = {
    "locked-in":        { label: "Locked In",   cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    "stable":           { label: "Stable",       cls: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    "slipping":         { label: "Slipping",     cls: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
    "tilted":           { label: "Tilted",       cls: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
    "stop-recommended": { label: "Stop Playing", cls: "text-red-400 bg-red-400/10 border-red-400/20" },
  }[tiltAnalysis.status]

  const rankColor: Record<string, string> = {
    IRON: "rank-iron", BRONZE: "rank-bronze", SILVER: "rank-silver",
    GOLD: "rank-gold", PLATINUM: "rank-platinum", EMERALD: "rank-emerald",
    DIAMOND: "rank-diamond", MASTER: "rank-master",
    GRANDMASTER: "rank-grandmaster", CHALLENGER: "rank-challenger",
  }
  const rankTier = (profile?.current_rank as string | null)?.split(" ")[0] ?? ""
  const rankCls = rankColor[rankTier] ?? "text-muted-foreground"

  return (
    <div className="w-full px-6 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {profile?.display_name ?? profile?.username ?? "Dashboard"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {profile?.riot_id ?? "No Riot ID connected"}
            {profile?.region ? ` · ${profile.region}` : ""}
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5 h-8 text-xs">
          <Link href="/session/new">
            <Plus className="h-3.5 w-3.5" />
            New Session
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">

        {/* ── Left column: rank panel ── */}
        <div className="space-y-3">

          {/* Ranked Solo/Duo */}
          <div className="rounded border border-border/60 bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Ranked Solo/Duo
            </p>
            <div className="flex items-center gap-3 mb-3">
              {/* Rank icon placeholder */}
              <div className="w-10 h-10 rounded bg-muted/30 flex items-center justify-center shrink-0">
                <span className={cn("text-lg font-black", rankCls)}>
                  {rankTier ? rankTier[0] : "?"}
                </span>
              </div>
              <div>
                <p className={cn("text-base font-bold leading-tight", rankCls)}>
                  {profile?.current_rank ?? "Unranked"}
                </p>
                <p className="text-xs text-muted-foreground">0 LP</p>
              </div>
            </div>
            {/* LP bar */}
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
              <div className="h-full w-0 rounded-full bg-primary" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{overallWR !== null ? `${overallWR}% WR` : "—"}</span>
              <span>{totalWins}W — {totalLosses}L</span>
            </div>
          </div>

          {/* Discipline & streak */}
          <div className="rounded border border-border/60 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Discipline</span>
              <span className="text-sm font-bold text-foreground">
                {profile?.discipline_score ?? 50}<span className="text-xs font-normal text-muted-foreground">/100</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${profile?.discipline_score ?? 50}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                Streak
              </span>
              <span className="text-sm font-bold text-foreground">
                {profile?.streak_days ?? 0}d
              </span>
            </div>
          </div>

          {/* Tilt status */}
          <div className="rounded border border-border/60 bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Mental State
            </p>
            <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-semibold", tiltConfig.cls)}>
              <div className={cn("w-1.5 h-1.5 rounded-full", tiltConfig.cls.split(" ")[0].replace("text-", "bg-"))} />
              {tiltConfig.label}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Score: <span className="text-foreground font-medium">{tiltAnalysis.currentScore}</span>/100
              <span className="ml-2 capitalize">{tiltAnalysis.trend}</span>
            </p>
            {tiltAnalysis.recommendation && (
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {tiltAnalysis.recommendation.reason}
              </p>
            )}
            <Link href="/analytics/tilt" className="text-xs text-primary hover:underline mt-2 block">
              Full analysis →
            </Link>
          </div>

          {/* Quick actions */}
          <div className="rounded border border-border/60 bg-card p-3 space-y-1.5">
            <QuickAction href="/session/new" icon={<Swords className="h-3.5 w-3.5 text-primary" />} label="Start Session" />
            <QuickAction href="/analytics/tilt" icon={<Target className="h-3.5 w-3.5 text-yellow-400" />} label="Tilt Analysis" />
            <QuickAction href="/accountability" icon={<BarChart3 className="h-3.5 w-3.5 text-blue-400" />} label="Accountability" />
            <QuickAction href="/duo/find" icon={<Users2 className="h-3.5 w-3.5 text-purple-400" />} label="Find Duo" />
          </div>

          {/* Riot ID alert */}
          {!profile?.riot_id && (
            <div className="rounded border border-yellow-500/20 bg-yellow-500/5 p-3">
              <div className="flex gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-foreground">Connect Riot ID</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                    Link your account for full tracking
                  </p>
                  <Link href="/profile/edit" className="text-xs text-primary hover:underline">
                    Connect →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right column: session history ── */}
        <div>
          {/* Tabs row */}
          <div className="flex items-center gap-4 mb-3 border-b border-border/40 pb-2">
            <span className="text-sm font-semibold text-foreground pb-2 border-b-2 border-primary -mb-2.5">
              Sessions
            </span>
            <Link href="/session/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors pb-2">
              All History
            </Link>
            <Link href="/analytics" className="text-sm text-muted-foreground hover:text-foreground transition-colors pb-2">
              Analytics
            </Link>
            <Link href="/accountability" className="text-sm text-muted-foreground hover:text-foreground transition-colors pb-2">
              Accountability
            </Link>
          </div>

          {/* Summary row */}
          <div className="flex items-center gap-6 mb-3 px-1 text-xs text-muted-foreground">
            <span>Last {recentSessions.length} sessions</span>
            <span>
              <span className="win-text font-semibold">{totalWins}W</span>
              {" "}<span className="loss-text font-semibold">{totalLosses}L</span>
            </span>
            {overallWR !== null && (
              <span className={cn("font-semibold", overallWR >= 50 ? "win-text" : "loss-text")}>
                {overallWR}% WR
              </span>
            )}
          </div>

          {/* Session cards */}
          <div className="space-y-1.5">
            {recentSessions.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No sessions yet — start your first one.
              </div>
            )}
            {recentSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>

          <div className="mt-3 text-center">
            <Link href="/session/history" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              View full history →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/30 transition-colors"
    >
      {icon}
      <span className="text-xs text-foreground/80">{label}</span>
    </Link>
  )
}
