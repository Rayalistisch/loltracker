import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Flame, AlertTriangle, User, Brain } from "lucide-react"
import { cn } from "@/lib/utils"
import { MOCK_TILT_ANALYSIS } from "@/lib/utils/mock-data"
import { getRecentSessions } from "@/services/session.service"
import { KineticSessionCard } from "@/components/features/session/KineticSessionCard"

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

  // Most-played champion per session
  const sessionIds = recentSessions.map(s => s.id)
  const topChampionMap: Record<string, string> = {}
  if (sessionIds.length > 0) {
    const { data: gameRows } = await supabase
      .from("session_games")
      .select("session_id, champion")
      .in("session_id", sessionIds)
      .not("champion", "is", null)
    const counts: Record<string, Record<string, number>> = {}
    for (const g of gameRows ?? []) {
      if (!g.champion) continue
      if (!counts[g.session_id]) counts[g.session_id] = {}
      counts[g.session_id][g.champion] = (counts[g.session_id][g.champion] ?? 0) + 1
    }
    for (const [sid, champcounts] of Object.entries(counts)) {
      topChampionMap[sid] = Object.entries(champcounts).sort((a, b) => b[1] - a[1])[0][0]
    }
  }

  const totalGames  = recentSessions.reduce((s, x) => s + (x.actualGames ?? 0), 0)
  const totalWins   = recentSessions.reduce((s, x) => s + (x.gamesWon   ?? 0), 0)
  const totalLosses = recentSessions.reduce((s, x) => s + (x.gamesLost  ?? 0), 0)
  const overallWR   = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : null

  const disciplineScore = profile?.discipline_score ?? 50
  const streakDays      = profile?.streak_days ?? 0
  const displayName     = profile?.display_name ?? profile?.username ?? "Summoner"
  const rankLabel       = (profile?.current_rank as string | null) ?? "Unranked"
  const rankTier        = rankLabel.split(" ")[0] ?? ""

  const RANK_COLOR: Record<string, string> = {
    IRON: "#9ca3af", BRONZE: "#cd7f32", SILVER: "#94a3b8",
    GOLD: "#fbbf24", PLATINUM: "#34d399", EMERALD: "#10b981",
    DIAMOND: "#818cf8", MASTER: "#c084fc", GRANDMASTER: "#f97316",
    CHALLENGER: "#ffd700",
  }
  const rankColor = RANK_COLOR[rankTier] ?? "#4cd6ff"

  const TILT_STATUS: Record<string, { label: string; color: string; desc: string }> = {
    "locked-in":        { label: "LOCKED IN",  color: "#34d399", desc: "Peak mental state" },
    "stable":           { label: "STABLE",     color: "#60a5fa", desc: "Consistent performance" },
    "slipping":         { label: "SLIPPING",   color: "#fbbf24", desc: "Monitor tilt triggers" },
    "tilted":           { label: "TILTED",     color: "#f97316", desc: "Take a short break" },
    "stop-recommended": { label: "STOP",       color: "#f87171", desc: "Rest recommended" },
  }
  const tiltCfg = TILT_STATUS[tiltAnalysis.status] ?? TILT_STATUS["stable"]

  return (
    <div className="w-full px-8 py-8 relative">

      {/* ── Profile header ─────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div className="flex items-center gap-6">

          {/* Avatar */}
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full overflow-hidden border-4 flex items-center justify-center"
              style={{ borderColor: "rgba(164,230,255,0.18)" }}
            >
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-[rgba(30,31,37,0.9)] flex items-center justify-center">
                  <User className="h-10 w-10 text-primary/30" />
                </div>
              )}
            </div>
            <div
              className="absolute -bottom-1 -right-1 px-2 py-0.5 text-[9px] font-black tracking-widest uppercase border"
              style={{
                background: "#0c0e13",
                borderColor: "rgba(164,230,255,0.25)",
                color: "#a4e6ff",
              }}
            >
              {profile?.region ?? "EUW"}
            </div>
          </div>

          {/* Name + info */}
          <div>
            <h2 className="text-4xl font-bold tracking-tighter text-foreground mb-1.5">
              {displayName}
            </h2>
            <div className="flex items-center gap-5 flex-wrap">
              <span className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                ⚡ {profile?.total_sessions ?? 0} Sessions
              </span>
              <span
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: rankColor }}
              >
                🏅 {rankLabel}
              </span>
              {profile?.riot_id && (
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {profile.riot_id}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex gap-3 shrink-0">
          <Link
            href="/profile/edit"
            className="px-6 py-2.5 border text-xs font-black tracking-widest uppercase transition-all hover:brightness-110"
            style={{
              background: "rgba(40,42,47,0.7)",
              borderColor: "rgba(133,147,153,0.3)",
              color: "#bbc9cf",
            }}
          >
            PROFILE SETTINGS
          </Link>
          <Link
            href="/session/new"
            className="px-6 py-2.5 text-xs font-black tracking-widest uppercase transition-all hover:brightness-110"
            style={{
              background: "#a4e6ff",
              color: "#001f28",
              boxShadow: "0 0 18px 2px rgba(164,230,255,0.22)",
            }}
          >
            NEW SESSION
          </Link>
        </div>
      </header>

      {/* ── Bento grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">

        {/* ── Left column (4 cols) ─────────────────────────────────────────── */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">

          {/* Ranked card */}
          <div className="glass-panel p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Rank emblem */}
              <div
                className="w-16 h-16 shrink-0 flex items-center justify-center border relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${rankColor}12, transparent)`,
                  borderColor: `${rankColor}25`,
                }}
              >
                <span className="text-3xl font-black" style={{ color: `${rankColor}80` }}>
                  {rankTier ? rankTier[0] : "?"}
                </span>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Ranked Solo/Duo
                </p>
                <p className="font-bold text-xl text-foreground tracking-tight">
                  {rankLabel.toUpperCase()}
                </p>
                <p className="text-xs font-bold" style={{ color: rankColor }}>0 LP</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {overallWR !== null ? `${overallWR}%` : "—"}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
                {totalWins}W — {totalLosses}L
              </p>
            </div>
          </div>

          {/* Discipline gauge */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-black tracking-widest text-foreground uppercase">
                Discipline Command
              </p>
              <span className="text-xs font-bold text-primary">
                {disciplineScore} / 100
              </span>
            </div>
            <div
              className="relative h-4 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <div
                className="absolute top-0 left-0 h-full rounded-full flex items-center justify-end"
                style={{
                  width: `${disciplineScore}%`,
                  background: "linear-gradient(90deg, #00d1ff, #a4e6ff)",
                  transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: "0 0 10px rgba(164,230,255,0.4)",
                }}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 shadow-[0_0_8px_#fff]" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
              Operational consistency is at baseline levels. Maintain discipline to optimize climb rate.
            </p>
          </div>

          {/* Streak + Mental grid */}
          <div className="grid grid-cols-2 gap-6">

            {/* Streak */}
            <div className="glass-panel p-6 flex flex-col items-center justify-center text-center gap-2">
              <Flame className="h-7 w-7 text-orange-400" style={{ filter: "drop-shadow(0 0 6px rgba(251,146,60,0.5))" }} />
              <p className="text-2xl font-bold text-foreground">{streakDays}d</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                Active Streak
              </p>
            </div>

            {/* Mental state */}
            <div className="glass-panel p-6 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Mental Core
                </p>
                <Brain className="h-4 w-4 shrink-0" style={{ color: tiltCfg.color }} />
              </div>
              <p className="text-lg font-bold mb-0.5" style={{ color: tiltCfg.color }}>
                {tiltCfg.label}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {tiltAnalysis.currentScore}/100 Capacity
              </p>
              <Link
                href="/analytics/tilt"
                className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1 mt-auto hover:underline"
                style={{ color: "#a4e6ff" }}
              >
                Full Analysis →
              </Link>
            </div>
          </div>

          {/* Riot ID alert */}
          {!profile?.riot_id && (
            <div
              className="p-4 border flex gap-3"
              style={{
                background: "rgba(251,191,36,0.04)",
                borderColor: "rgba(251,191,36,0.2)",
              }}
            >
              <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-foreground mb-0.5">Connect Riot ID</p>
                <p className="text-[10px] text-muted-foreground mb-2">
                  Link your account for full tracking
                </p>
                <Link
                  href="/profile/edit"
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                >
                  Connect →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Right column (8 cols) ────────────────────────────────────────── */}
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">

          {/* Tab bar */}
          <div
            className="flex items-center border-b overflow-x-auto gap-8"
            style={{ borderColor: "rgba(133,147,153,0.15)" }}
          >
            <button className="relative pb-4 px-2 text-xs font-black tracking-widest text-primary uppercase whitespace-nowrap flex items-center gap-2 shrink-0">
              SESSIONS
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
            </button>
            <Link
              href="/session/history"
              className="pb-4 px-2 text-xs font-black tracking-widest text-muted-foreground hover:text-foreground uppercase whitespace-nowrap transition-colors shrink-0"
            >
              ALL HISTORY
            </Link>
            <Link
              href="/analytics"
              className="pb-4 px-2 text-xs font-black tracking-widest text-muted-foreground hover:text-foreground uppercase whitespace-nowrap transition-colors shrink-0"
            >
              ANALYTICS
            </Link>
            <Link
              href="/accountability"
              className="pb-4 px-2 text-xs font-black tracking-widest text-muted-foreground hover:text-foreground uppercase whitespace-nowrap transition-colors shrink-0"
            >
              ACCOUNTABILITY
            </Link>
          </div>

          {/* Summary stats bar */}
          <div
            className="flex flex-wrap items-center justify-between gap-6 px-5 py-4 border"
            style={{
              background: "rgba(17,19,24,0.6)",
              borderColor: "rgba(133,147,153,0.1)",
            }}
          >
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Sessions</p>
                <p className="font-bold text-foreground text-sm">Last {recentSessions.length} Sessions</p>
              </div>
              <div className="h-8 w-px hidden sm:block" style={{ background: "rgba(133,147,153,0.2)" }} />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">W/L Record</p>
                <p className="font-bold text-sm" style={{ color: "#4cd6ff" }}>
                  {totalWins}W {totalLosses}L
                </p>
              </div>
              <div className="h-8 w-px hidden sm:block" style={{ background: "rgba(133,147,153,0.2)" }} />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Win Rate</p>
                <p className={cn("font-bold text-sm", overallWR !== null && overallWR >= 50 ? "text-emerald-400" : "text-red-400")}>
                  {overallWR !== null ? `${overallWR}% WR` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Session list */}
          <div className="space-y-px">
            {recentSessions.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 border border-dashed"
                style={{
                  borderColor: "rgba(133,147,153,0.2)",
                  background: "rgba(12,14,19,0.8)",
                }}
              >
                <span className="text-5xl mb-4 opacity-20">📜</span>
                <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">
                  End of recorded session logs
                </p>
                <p className="text-[10px] text-muted-foreground/40 mt-2">
                  Start a new session to record tactical data.
                </p>
              </div>
            ) : (
              recentSessions.map(session => (
                <KineticSessionCard
                  key={session.id}
                  session={session}
                  topChampion={topChampionMap[session.id]}
                />
              ))
            )}
          </div>

          {/* View all link */}
          {recentSessions.length > 0 && (
            <div className="text-center">
              <Link
                href="/session/history"
                className="text-[10px] font-black uppercase tracking-widest hover:underline"
                style={{ color: "#a4e6ff" }}
              >
                VIEW FULL HISTORY →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
