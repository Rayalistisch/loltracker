import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSessionById } from "@/services/session.service"
import { formatDurationSeconds, formatRelative } from "@/lib/utils/format"
import { SESSION_GOALS } from "@/lib/utils/lol-constants"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, Target, Brain, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  params: Promise<{ sessionId: string }>
}

export const metadata = { title: "Session Detail" }

export default async function SessionDetailPage({ params }: Props) {
  const { sessionId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const session = await getSessionById(sessionId, user.id)
  if (!session) notFound()

  const checkin    = session.preCheckin
  const reflection = session.postReflection

  const wins   = session.gamesWon   ?? 0
  const losses = session.gamesLost  ?? 0
  const total  = session.actualGames ?? wins + losses
  const wr     = total > 0 ? Math.round((wins / total) * 100) : null
  const isNet  = wins >= losses

  const durationSeconds = session.startedAt && session.endedAt
    ? Math.floor((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
    : null

  const goalLabel = checkin?.goal
    ? SESSION_GOALS.find(g => g.value === checkin.goal)?.label
    : null

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-5">

      {/* Back */}
      <Link
        href="/session/history"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Session history
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Session</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {session.startedAt ? formatRelative(session.startedAt) : "—"}
          </p>
        </div>
        <span className={cn(
          "text-xs font-semibold px-2.5 py-1 rounded-full border",
          session.status === "completed"
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : session.status === "active"
            ? "bg-primary/10 text-primary border-primary/20"
            : "bg-muted/40 text-muted-foreground border-border/40"
        )}>
          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        <StatBox label="W — L" value={`${wins} / ${losses}`} positive={isNet} />
        <StatBox label="Win Rate" value={wr !== null ? `${wr}%` : "—"} positive={wr !== null ? wr >= 50 : undefined} />
        <StatBox label="Games" value={String(total)} />
        {session.lpDelta != null && (
          <StatBox
            label="LP"
            value={`${session.lpDelta > 0 ? "+" : ""}${session.lpDelta}`}
            positive={session.lpDelta > 0}
          />
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {durationSeconds !== null && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatDurationSeconds(durationSeconds)}
          </span>
        )}
        {session.startedAt && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(session.startedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        )}
        {session.rankAtStart && (
          <span className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            {session.rankAtStart}
            {session.rankAtEnd && session.rankAtEnd !== session.rankAtStart && (
              <> → {session.rankAtEnd}</>
            )}
          </span>
        )}
      </div>

      {/* Pre-game check-in */}
      {checkin && (
        <Section title="Pre-game check-in">
          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="Mental state" value={`${checkin.mentalState} / 5`} />
            <InfoRow label="Energy level" value={`${checkin.energyLevel} / 5`} />
            {goalLabel && <InfoRow label="Goal" value={goalLabel} />}
            {checkin.plannedRoles?.length > 0 && (
              <InfoRow label="Roles" value={checkin.plannedRoles.join(", ")} />
            )}
            {checkin.championPool?.length > 0 && (
              <InfoRow label="Champions" value={checkin.championPool.join(", ")} />
            )}
            {checkin.stopCondition && (
              <div className="col-span-2">
                <InfoRow label="Stop condition" value={checkin.stopCondition} />
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Post-game reflection */}
      {reflection && (
        <Section title="Reflection">
          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="Mental state (end)" value={`${reflection.mentalStateEnd} / 5`} />
            <InfoRow label="Overall rating" value={`${reflection.overallRating} / 5`} />
            <InfoRow label="Tilt moments" value={String(reflection.tiltMoments)} />
            <InfoRow
              label="Stop condition"
              value={reflection.followedStopCondition ? "Followed" : "Ignored"}
              positive={reflection.followedStopCondition}
            />
          </div>
          {reflection.whatWentWell && (
            <div className="mt-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              <p className="text-xs text-muted-foreground mb-1">What went well</p>
              <p className="text-sm">{reflection.whatWentWell}</p>
            </div>
          )}
          {reflection.biggestMistake && (
            <div className="mt-2 p-3 rounded-lg bg-orange-500/5 border border-orange-500/15">
              <p className="text-xs text-muted-foreground mb-1">Biggest mistake</p>
              <p className="text-sm">{reflection.biggestMistake}</p>
            </div>
          )}
          {reflection.improvementFocus && (
            <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/15">
              <p className="text-xs text-muted-foreground mb-1">Focus next session</p>
              <p className="text-sm">{reflection.improvementFocus}</p>
            </div>
          )}
        </Section>
      )}

      {/* No reflection yet */}
      {!reflection && session.status === "completed" && (
        <div className="rounded-xl border border-border/50 bg-card/40 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">No reflection logged</p>
            <p className="text-xs text-muted-foreground mt-0.5">Add a reflection to this session</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/session/${sessionId}/reflect`}>Reflect</Link>
          </Button>
        </div>
      )}

    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-5">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{title}</h2>
      {children}
    </div>
  )
}

function StatBox({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 text-center">
      <p className={cn(
        "text-sm font-bold tabular-nums",
        positive === true  ? "win-text" :
        positive === false ? "loss-text" :
        "text-foreground"
      )}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  )
}

function InfoRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn(
        "text-sm font-medium mt-0.5",
        positive === true  ? "text-emerald-400" :
        positive === false ? "loss-text" :
        "text-foreground"
      )}>
        {value}
      </p>
    </div>
  )
}
