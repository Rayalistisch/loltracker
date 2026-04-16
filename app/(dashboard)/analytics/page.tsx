import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getTiltAnalysis, getWeeklyStats, getSessionHeatmap } from "@/services/analytics.service"
import { getRecentSessions } from "@/services/session.service"
import { TiltScoreGauge } from "@/components/features/analytics/TiltScoreGauge"
import { StopRecommendationCard } from "@/components/features/analytics/StopRecommendationCard"
import { SessionQualityChart } from "@/components/features/analytics/SessionQualityChart"
import Link from "next/link"
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata = { title: "Analytics" }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [tiltAnalysis, sessions, weeklyStats] = await Promise.all([
    getTiltAnalysis(user.id),
    getRecentSessions(user.id, 20),
    getWeeklyStats(user.id, 8),
  ])

  const totalGames = sessions.reduce((sum, s) => sum + (s.actualGames ?? 0), 0)
  const totalWins = sessions.reduce((sum, s) => sum + (s.gamesWon ?? 0), 0)
  const overallWR = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : null

  const avgMentalStart = sessions.filter(s => s.preCheckin).length > 0
    ? (sessions.filter(s => s.preCheckin).reduce((sum, s) => sum + (s.preCheckin?.mentalState ?? 0), 0) /
       sessions.filter(s => s.preCheckin).length).toFixed(1)
    : null

  return (
    <div className="w-full px-6 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last {sessions.length} sessions
          </p>
        </div>
        <Link href="/analytics/tilt" className="text-xs text-primary hover:underline flex items-center gap-1">
          Tilt deep dive <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-border/40 pb-2">
        <span className="text-sm font-semibold text-foreground pb-2 border-b-2 border-primary -mb-2.5">
          Overview
        </span>
        <Link href="/analytics/tilt" className="text-sm text-muted-foreground hover:text-foreground transition-colors pb-2">
          Tilt Analysis
        </Link>
        <Link href="/session/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors pb-2">
          Sessions
        </Link>
        <Link href="/accountability" className="text-sm text-muted-foreground hover:text-foreground transition-colors pb-2">
          Accountability
        </Link>
      </div>

      {/* Tilt + key stats */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-3">
        {/* Tilt gauge panel */}
        <div className="rounded border border-border/60 bg-card p-4 flex flex-col items-center justify-center gap-3">
          <TiltScoreGauge
            score={tiltAnalysis.currentScore}
            status={tiltAnalysis.status}
            size="md"
          />
          <div className={cn(
            "flex items-center gap-1 text-xs",
            tiltAnalysis.trend === "improving" ? "text-emerald-400" :
            tiltAnalysis.trend === "worsening" ? "text-red-400" :
            "text-muted-foreground"
          )}>
            {tiltAnalysis.trend === "improving" ? <TrendingUp className="h-3.5 w-3.5" /> :
             tiltAnalysis.trend === "worsening" ? <TrendingDown className="h-3.5 w-3.5" /> :
             <Minus className="h-3.5 w-3.5" />}
            <span className="capitalize">{tiltAnalysis.trend}</span>
          </div>
        </div>

        {/* Key stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <StatCard
            label="Win rate"
            value={overallWR !== null ? `${overallWR}%` : "—"}
            sub={`${totalGames} games`}
            positive={overallWR !== null && overallWR >= 50}
          />
          <StatCard
            label="Sessions"
            value={String(sessions.length)}
            sub="tracked"
          />
          <StatCard
            label="Avg mental"
            value={avgMentalStart ? `${avgMentalStart}/5` : "—"}
            sub="at check-in"
          />
          <StatCard
            label="Check-in rate"
            value={sessions.length > 0
              ? `${Math.round(sessions.filter(s => s.preCheckin).length / sessions.length * 100)}%`
              : "—"
            }
            sub="with check-in"
          />
          <StatCard
            label="Reflection rate"
            value={sessions.length > 0
              ? `${Math.round(sessions.filter(s => s.postReflection).length / sessions.length * 100)}%`
              : "—"
            }
            sub="sessions reflected"
          />
          <StatCard
            label="Stop adherence"
            value={(() => {
              const withStop = sessions.filter(s => s.preCheckin?.stopCondition && s.postReflection)
              if (withStop.length === 0) return "—"
              const followed = withStop.filter(s => s.postReflection?.followedStopCondition === true).length
              return `${Math.round(followed / withStop.length * 100)}%`
            })()}
            sub="followed stop"
          />
        </div>
      </div>

      {/* Stop recommendation */}
      {tiltAnalysis.recommendation && (
        <StopRecommendationCard recommendation={tiltAnalysis.recommendation} />
      )}

      {/* Session quality chart */}
      <div className="rounded border border-border/60 bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Mental State — Start vs End
        </p>
        <SessionQualityChart sessions={sessions} />
      </div>

      {/* Tilt patterns */}
      {tiltAnalysis.triggerPatterns.length > 0 && (
        <div className="rounded border border-border/60 bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Active Tilt Patterns
          </p>
          <div className="space-y-2">
            {tiltAnalysis.triggerPatterns.map((pattern, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded border",
                  pattern.severity === "high" ? "bg-red-500/5 border-red-500/20" :
                  pattern.severity === "medium" ? "bg-orange-500/5 border-orange-500/20" :
                  "bg-yellow-500/5 border-yellow-500/20"
                )}
              >
                <div>
                  <p className="text-xs font-medium capitalize">
                    {pattern.type.replace(/-/g, " ")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {pattern.occurrences}× in recent sessions
                  </p>
                </div>
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-sm",
                  pattern.severity === "high" ? "bg-red-500/10 text-red-400" :
                  pattern.severity === "medium" ? "bg-orange-500/10 text-orange-400" :
                  "bg-yellow-500/10 text-yellow-400"
                )}>
                  {pattern.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly activity */}
      {weeklyStats.length > 0 && (
        <div className="rounded border border-border/60 bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Weekly Activity
          </p>
          <div className="space-y-2">
            {weeklyStats.map((week) => {
              const wr = week.games > 0 ? Math.round((week.wins / week.games) * 100) : null
              return (
                <div key={week.weekLabel} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-12 shrink-0">{week.weekLabel}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min((week.sessions / 7) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-24 text-right shrink-0 tabular-nums">
                    {week.sessions} sess{wr !== null ? ` · ${wr}% WR` : ""}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string
  value: string
  sub: string
  positive?: boolean
}) {
  return (
    <div className="rounded border border-border/60 bg-card/60 p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
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
