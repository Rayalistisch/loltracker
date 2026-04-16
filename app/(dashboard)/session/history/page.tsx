import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getRecentSessions } from "@/services/session.service"
import { SessionCard } from "@/components/features/session/SessionCard"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata = { title: "Session History" }

export default async function SessionHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const sessions = await getRecentSessions(user.id, 50)

  const totalWins   = sessions.reduce((s, x) => s + (x.gamesWon ?? 0), 0)
  const totalLosses = sessions.reduce((s, x) => s + (x.gamesLost ?? 0), 0)
  const totalGames  = sessions.reduce((s, x) => s + (x.actualGames ?? 0), 0)
  const overallWR   = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : null

  return (
    <div className="w-full px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Session History</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} logged
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5 h-8 text-xs">
          <Link href="/session/new">
            <Plus className="h-3.5 w-3.5" />
            New Session
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-3 border-b border-border/40 pb-2">
        <span className="text-sm font-semibold text-foreground pb-2 border-b-2 border-primary -mb-2.5">
          All Sessions
        </span>
        <Link href="/analytics" className="text-sm text-muted-foreground hover:text-foreground transition-colors pb-2">
          Analytics
        </Link>
        <Link href="/accountability" className="text-sm text-muted-foreground hover:text-foreground transition-colors pb-2">
          Accountability
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded border border-border/60 bg-card p-12 text-center mt-4">
          <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">No sessions yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Start your first session to begin tracking your progress
          </p>
          <Button asChild size="sm">
            <Link href="/session/new">Start a Session</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div className="flex items-center gap-6 mb-3 px-1 text-xs text-muted-foreground">
            <span>{sessions.length} sessions</span>
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

          {/* Session rows */}
          <div className="space-y-1.5">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
