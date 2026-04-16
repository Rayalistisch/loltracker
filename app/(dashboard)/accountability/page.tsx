import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getDisciplineMetrics, getSessionHeatmap, getWeeklyStats } from "@/services/analytics.service"
import { getRecentSessions } from "@/services/session.service"
import { DisciplineScoreRing } from "@/components/features/accountability/DisciplineScoreRing"
import { HabitHeatmap } from "@/components/features/accountability/HabitHeatmap"
import { Flame, Trophy, Target, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata = { title: "Accountability" }

export default async function AccountabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [disciplineMetrics, heatmapData, weeklyStats, sessions, profile] = await Promise.all([
    getDisciplineMetrics(user.id),
    getSessionHeatmap(user.id, 12),
    getWeeklyStats(user.id, 8),
    getRecentSessions(user.id, 20),
    supabase
      .from("player_profiles")
      .select("streak_days, total_sessions, discipline_score")
      .eq("id", user.id)
      .single()
      .then((r) => r.data),
  ])

  const streakDays = (profile?.streak_days as number | null) ?? 0
  const totalSessions = (profile?.total_sessions as number | null) ?? 0

  const currentWeekSessions = weeklyStats[weeklyStats.length - 1]
  const lastWeekSessions = weeklyStats[weeklyStats.length - 2]

  const sessionsTrend = currentWeekSessions && lastWeekSessions
    ? currentWeekSessions.sessions - lastWeekSessions.sessions
    : null

  return (
    <div className="w-full px-6 py-6 space-y-4">
      {/* Header */}
      <div className="mb-1">
        <h1 className="text-xl font-bold tracking-tight">Accountability</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Discipline score and habit tracking</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-border/40 pb-2">
        <span className="text-sm font-semibold text-foreground pb-2 border-b-2 border-primary -mb-2.5">
          Overview
        </span>
        <a href="/session/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors pb-2">
          Sessions
        </a>
        <a href="/analytics" className="text-sm text-muted-foreground hover:text-foreground transition-colors pb-2">
          Analytics
        </a>
      </div>

      {/* Top row: discipline ring + key stats */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-3">
        {/* Discipline ring */}
        <div className="rounded border border-border/60 bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Discipline Score
          </p>
          <DisciplineScoreRing metrics={disciplineMetrics} size="md" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={<Flame className="h-4 w-4 text-orange-400" />}
            label="Current streak"
            value={`${streakDays}d`}
            sub="consecutive days"
            highlight={streakDays >= 7}
          />
          <StatCard
            icon={<Trophy className="h-4 w-4 text-yellow-400" />}
            label="Total sessions"
            value={String(totalSessions)}
            sub="all time"
          />
          <StatCard
            icon={<Target className="h-4 w-4 text-primary" />}
            label="This week"
            value={String(currentWeekSessions?.sessions ?? 0)}
            sub={sessionsTrend !== null && sessionsTrend !== 0
              ? `${sessionsTrend > 0 ? "+" : ""}${sessionsTrend} vs last week`
              : "sessions"}
            positive={sessionsTrend !== null ? sessionsTrend > 0 : undefined}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
            label="Stop adherence"
            value={`${Math.round(disciplineMetrics.stopAdherence * 100)}%`}
            sub="followed stop condition"
            positive={disciplineMetrics.stopAdherence >= 0.7}
          />
        </div>
      </div>

      {/* Habit heatmap */}
      <div className="rounded border border-border/60 bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Activity — Last 12 Weeks
        </p>
        <HabitHeatmap data={heatmapData} weeks={12} />
      </div>

      {/* Weekly breakdown table */}
      {weeklyStats.length > 0 && (
        <div className="rounded border border-border/60 bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Weekly Breakdown
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] text-muted-foreground uppercase tracking-wide border-b border-border/40">
                  <th className="pb-2 font-medium">Week</th>
                  <th className="pb-2 font-medium text-right">Sessions</th>
                  <th className="pb-2 font-medium text-right">Games</th>
                  <th className="pb-2 font-medium text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {weeklyStats.map((week) => {
                  const wr = week.games > 0
                    ? Math.round((week.wins / week.games) * 100)
                    : null
                  return (
                    <tr key={week.weekLabel}>
                      <td className="py-2 text-xs text-muted-foreground">{week.weekLabel}</td>
                      <td className="py-2 text-xs text-right">{week.sessions}</td>
                      <td className="py-2 text-xs text-right">{week.games}</td>
                      <td className="py-2 text-xs text-right">
                        {wr !== null ? (
                          <span className={cn(
                            "font-semibold tabular-nums",
                            wr >= 55 ? "win-text" :
                            wr <= 40 ? "loss-text" :
                            "text-foreground"
                          )}>
                            {wr}%
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* How to improve */}
      <div className="rounded border border-border/60 bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          How to improve your score
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { pct: Math.round(disciplineMetrics.checkinRate * 100), label: "Complete pre-game check-ins", tip: "35 pts max" },
            { pct: Math.round(disciplineMetrics.stopAdherence * 100), label: "Follow your stop conditions", tip: "35 pts max" },
            { pct: Math.round(disciplineMetrics.reflectionQuality * 100), label: "Fill in post-session reflections", tip: "20 pts max" },
            { pct: Math.round(disciplineMetrics.streakBonus * 100), label: "Maintain a daily session streak", tip: "10 pts max" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded border border-border/40 bg-muted/10">
              <div className="shrink-0 w-8 h-8 rounded bg-muted/40 flex items-center justify-center text-[10px] font-bold tabular-nums">
                {item.pct}%
              </div>
              <div>
                <p className="text-xs font-medium">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
  positive,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  highlight?: boolean
  positive?: boolean
}) {
  return (
    <div className={cn(
      "rounded border p-3",
      highlight ? "border-orange-500/30 bg-orange-500/5" : "border-border/60 bg-card/60"
    )}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      <p className={cn(
        "text-xl font-bold tabular-nums",
        positive === true ? "win-text" :
        positive === false ? "loss-text" :
        "text-foreground"
      )}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  )
}
