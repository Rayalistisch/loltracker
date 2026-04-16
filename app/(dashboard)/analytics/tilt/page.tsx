import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getTiltAnalysis } from "@/services/analytics.service"
import { getRecentSessions } from "@/services/session.service"
import { TiltScoreGauge } from "@/components/features/analytics/TiltScoreGauge"
import { StopRecommendationCard } from "@/components/features/analytics/StopRecommendationCard"
import { SessionQualityChart } from "@/components/features/analytics/SessionQualityChart"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/format"

export const metadata = { title: "Tilt Analysis" }

export default async function TiltPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [tiltAnalysis, sessions] = await Promise.all([
    getTiltAnalysis(user.id),
    getRecentSessions(user.id, 20),
  ])

  // Tilt history: show tilt scores for sessions that have them
  const tiltHistory = sessions
    .filter((s) => s.tiltScore !== null)
    .map((s) => ({
      date: formatDate(s.createdAt),
      score: s.tiltScore!,
      wins: s.gamesWon ?? 0,
      losses: s.gamesLost ?? 0,
    }))

  // Best / worst day stats
  const dayCounts: Record<string, { wins: number; games: number }> = {}
  sessions.forEach((s) => {
    const day = new Date(s.createdAt).toLocaleDateString("en-US", { weekday: "short" })
    if (!dayCounts[day]) dayCounts[day] = { wins: 0, games: 0 }
    dayCounts[day].wins += s.gamesWon ?? 0
    dayCounts[day].games += s.actualGames ?? 0
  })

  const dayStats = Object.entries(dayCounts)
    .map(([day, stats]) => ({
      day,
      wr: stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : null,
      games: stats.games,
    }))
    .filter((d) => d.games >= 3) // only days with enough data
    .sort((a, b) => (b.wr ?? 0) - (a.wr ?? 0))

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <div>
        <Link
          href="/analytics"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Analytics
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Tilt Deep Dive</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed breakdown of your tilt patterns and triggers
        </p>
      </div>

      {/* Main gauge + recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card/80 p-6 flex flex-col items-center justify-center">
          <TiltScoreGauge
            score={tiltAnalysis.currentScore}
            status={tiltAnalysis.status}
            size="lg"
          />
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Trend: <span className="capitalize font-medium text-foreground">{tiltAnalysis.trend}</span>
          </p>
        </div>

        <div className="flex flex-col justify-center gap-4">
          {tiltAnalysis.recommendation ? (
            <StopRecommendationCard recommendation={tiltAnalysis.recommendation} />
          ) : (
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
              <p className="text-sm font-medium text-green-400">You&apos;re in good shape</p>
              <p className="text-xs text-muted-foreground mt-1">
                No tilt signals detected. Keep it up!
              </p>
            </div>
          )}

          {/* Score breakdown */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground mb-2">Score breakdown</p>
            {tiltAnalysis.triggerPatterns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active patterns</p>
            ) : (
              tiltAnalysis.triggerPatterns.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-muted-foreground">
                    {p.type.replace(/-/g, " ")}
                  </span>
                  <span className={cn(
                    "font-semibold",
                    p.severity === "high" ? "text-red-400" :
                    p.severity === "medium" ? "text-orange-400" :
                    "text-yellow-400"
                  )}>
                    {p.occurrences}×
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tilt score history */}
      {tiltHistory.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/80 p-6">
          <h2 className="text-base font-semibold mb-4">Tilt Score History</h2>
          <div className="space-y-2">
            {tiltHistory.map((entry, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 shrink-0">{entry.date}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      entry.score <= 25 ? "bg-green-500" :
                      entry.score <= 50 ? "bg-blue-500" :
                      entry.score <= 70 ? "bg-yellow-500" :
                      entry.score <= 85 ? "bg-orange-500" :
                      "bg-red-500"
                    )}
                    style={{ width: `${entry.score}%` }}
                  />
                </div>
                <span className={cn(
                  "text-xs font-bold w-8 text-right",
                  entry.score <= 25 ? "text-green-400" :
                  entry.score <= 50 ? "text-blue-400" :
                  entry.score <= 70 ? "text-yellow-400" :
                  entry.score <= 85 ? "text-orange-400" :
                  "text-red-400"
                )}>
                  {entry.score}
                </span>
                <span className="text-xs text-muted-foreground w-16 text-right shrink-0">
                  <span className="text-green-400">{entry.wins}W</span>
                  {" "}
                  <span className="text-red-400">{entry.losses}L</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mental state chart */}
      <div className="rounded-2xl border border-border bg-card/80 p-6">
        <h2 className="text-base font-semibold mb-4">Mental State Over Sessions</h2>
        <SessionQualityChart sessions={sessions} />
      </div>

      {/* Best / worst days */}
      {dayStats.length >= 2 && (
        <div className="rounded-2xl border border-border bg-card/80 p-6">
          <h2 className="text-base font-semibold mb-4">Performance by Day of Week</h2>
          <div className="space-y-2">
            {dayStats.map((d, i) => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-10">{d.day}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      i === 0 ? "bg-green-500" :
                      i === dayStats.length - 1 ? "bg-red-500" :
                      "bg-primary"
                    )}
                    style={{ width: `${d.wr ?? 0}%` }}
                  />
                </div>
                <span className={cn(
                  "text-sm font-semibold w-12 text-right",
                  i === 0 ? "text-green-400" :
                  i === dayStats.length - 1 ? "text-red-400" :
                  "text-foreground"
                )}>
                  {d.wr !== null ? `${d.wr}%` : "—"}
                </span>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {d.games}g
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
