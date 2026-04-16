import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSessionById } from "@/services/session.service"
import { formatDurationSeconds, formatRelative } from "@/lib/utils/format"
import { SESSION_GOALS } from "@/lib/utils/lol-constants"
import { cn } from "@/lib/utils"
import { champTileUrl } from "@/lib/utils/ddragon"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Clock, Calendar, Flag, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GameRow } from "@/components/features/session/GameRow"
import { SessionInsights } from "@/components/features/session/SessionInsights"

interface Props {
  params: Promise<{ sessionId: string }>
}

export const metadata = { title: "Session Detail" }

// ─── Circular gauge (full ring) ───────────────────────────────────────────────

function RingGauge({
  value, max, label, color, unit = "",
}: {
  value: number; max: number; label: string; color: string; unit?: string
}) {
  const size = 72
  const r    = 28
  const circ = 2 * Math.PI * r
  const pct  = Math.min(Math.max(value / max, 0), 1)
  const offset = circ * (1 - pct)

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-black tabular-nums leading-none" style={{ color }}>
            {value}{unit}
          </span>
        </div>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SessionDetailPage({ params }: Props) {
  const { sessionId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const session = await getSessionById(sessionId, user.id)
  if (!session) notFound()

  const { data: games } = await supabase
    .from("session_games")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .order("played_at", { ascending: false })

  const checkin    = session.preCheckin
  const reflection = session.postReflection

  const wins   = session.gamesWon   ?? 0
  const losses = session.gamesLost  ?? 0
  const total  = session.actualGames ?? wins + losses
  const wr     = total > 0 ? Math.round((wins / total) * 100) : 0
  const isWin  = wins >= losses && total > 0
  const lpDelta = session.lpDelta

  const durationSeconds = session.startedAt && session.endedAt
    ? Math.floor((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
    : null

  const goalLabel = checkin?.goal
    ? SESSION_GOALS.find(g => g.value === checkin.goal)?.label
    : null

  // Top champion from actual games played
  const topChampion: string | null = (() => {
    if (!games?.length) return checkin?.championPool?.[0] ?? null
    const counts: Record<string, number> = {}
    for (const g of games) {
      if (!g.champion) continue
      counts[g.champion] = (counts[g.champion] ?? 0) + 1
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return sorted[0]?.[0] ?? checkin?.championPool?.[0] ?? null
  })()

  const accentColor = isWin ? "oklch(0.60 0.20 258)" : "oklch(0.62 0.22 22)"
  const accentHex   = isWin ? "#4cd6ff" : "#f87171"
  const role        = checkin?.plannedRoles?.[0]

  return (
    <div className="w-full px-6 py-6 space-y-6">

      {/* Back */}
      <Link
        href="/session/history"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Session history
      </Link>

      {/* ── Hero section ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">

        {/* Hero card */}
        <div
          className="relative rounded-xl overflow-hidden border flex items-center gap-6 p-6 min-h-[160px]"
          style={{
            borderColor: `${accentHex}33`,
            background: `linear-gradient(105deg, ${accentHex}18 0%, oklch(0.11 0 0) 55%)`,
            borderLeft: `4px solid ${accentColor}`,
            boxShadow: `0 0 40px 0 ${accentHex}18`,
          }}
        >
          {/* Watermark */}
          <div className="absolute top-0 right-0 px-6 py-4 pointer-events-none select-none overflow-hidden">
            <span
              className="text-7xl font-black tracking-tighter italic opacity-[0.06] leading-none"
              style={{ color: accentHex }}
            >
              {isWin ? "VICTORY" : "DEFEAT"}
            </span>
          </div>

          {/* Champion tile */}
          {topChampion ? (
            <div className="relative shrink-0">
              <div
                className="absolute -inset-1 rounded-xl blur-md opacity-40"
                style={{ background: accentColor }}
              />
              <Image
                src={champTileUrl(topChampion)}
                alt={topChampion}
                width={96}
                height={96}
                className="w-24 h-24 rounded-xl object-cover object-[50%_10%] relative z-10 border-2"
                style={{ borderColor: `${accentHex}66` }}
                unoptimized
              />
            </div>
          ) : (
            <div
              className="w-24 h-24 rounded-xl shrink-0 flex items-center justify-center text-3xl font-black border-2 relative"
              style={{ borderColor: `${accentHex}44`, background: `${accentHex}12` }}
            >
              ?
            </div>
          )}

          {/* Result + champion name */}
          <div className="relative z-10 flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className="text-3xl font-black tracking-tight" style={{ color: accentHex }}>
                {isWin ? "Victory" : "Defeat"}
              </span>
              {topChampion && (
                <span className="text-base font-semibold text-foreground/70">— {topChampion}</span>
              )}
              <span className={cn(
                "text-xs font-bold px-2.5 py-0.5 rounded-full border ml-auto",
                session.status === "completed"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-primary/10 text-primary border-primary/20"
              )}>
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </span>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-5 flex-wrap">
              {durationSeconds !== null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDurationSeconds(durationSeconds)}
                </span>
              )}
              {session.startedAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatRelative(session.startedAt)}
                </span>
              )}
              {session.rankAtStart && (
                <span className="flex items-center gap-1.5 text-xs">
                  {session.rankAtStart}
                  {session.rankAtEnd && session.rankAtEnd !== session.rankAtStart && (
                    <> → {session.rankAtEnd}</>
                  )}
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-8 flex-wrap">
              <HeroStat
                value={`${wins} / ${losses}`}
                label="W — L"
                color={isWin ? "#4ade80" : "#f87171"}
              />
              <HeroStat
                value={total > 0 ? `${wr}%` : "—"}
                label="Win Rate"
                color={wr >= 50 ? "#4ade80" : "#f87171"}
              />
              <HeroStat
                value={String(total)}
                label="Games"
                color="#e2e2e9"
              />
              {lpDelta != null && (
                <HeroStat
                  value={`${lpDelta > 0 ? "+" : ""}${lpDelta} LP`}
                  label="LP Delta"
                  color={lpDelta > 0 ? "#4ade80" : "#f87171"}
                  icon={lpDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                />
              )}
            </div>
          </div>
        </div>

        {/* Gauges panel */}
        <div
          className="rounded-xl border p-5 flex flex-col justify-between min-w-0"
          style={{
            background: "rgba(30,31,37,0.6)",
            backdropFilter: "blur(12px)",
            borderColor: "rgba(133,147,153,0.15)",
            borderTop: "1px solid rgba(133,147,153,0.2)",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Session Performance
          </p>

          <div className="grid grid-cols-3 gap-2">
            <RingGauge
              value={wr}
              max={100}
              label="Win Rate"
              color={wr >= 50 ? "#4cd6ff" : "#f87171"}
              unit="%"
            />
            <RingGauge
              value={checkin?.mentalState ?? reflection?.mentalStateEnd ?? 3}
              max={5}
              label="Mental"
              color="#ddb7ff"
            />
            <RingGauge
              value={reflection?.overallRating ?? 0}
              max={5}
              label="Rating"
              color="#ffd692"
            />
          </div>

          {/* Kill participation / stop condition */}
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            {goalLabel && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Goal</span>
                <span className="font-semibold text-primary">{goalLabel}</span>
              </div>
            )}
            {role && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Role</span>
                <span className="font-semibold text-foreground">{role}</span>
              </div>
            )}
            {reflection && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Stop condition</span>
                <span className={cn("font-semibold", reflection.followedStopCondition ? "text-emerald-400" : "loss-text")}>
                  {reflection.followedStopCondition ? "Followed" : "Ignored"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Games scoreboard ──────────────────────────────────────────────────── */}
      {games && games.length > 0 && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            background: "rgba(30,31,37,0.6)",
            backdropFilter: "blur(12px)",
            borderColor: "rgba(133,147,153,0.15)",
          }}
        >
          {/* Table header */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex-1">
              Games ({games.length})
            </h2>
            <div className="hidden md:flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pr-8">
              <span className="w-32 text-center">KDA</span>
              <span className="w-20 text-center">CS</span>
              <span className="w-20 text-center">Damage</span>
              <span className="w-16 text-center">Vision</span>
              <span className="w-14 text-center">Time</span>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.04]">
            {games.map((game) => (
              <GameRow key={game.id} game={game} role={role} />
            ))}
          </div>
        </div>
      )}

      {/* ── Session insights ─────────────────────────────────────────────────── */}
      {games && games.length > 0 && (
        <SessionInsights
          games={games as Parameters<typeof SessionInsights>[0]["games"]}
          role={role}
          checkin={checkin ?? null}
          reflection={reflection ?? null}
        />
      )}

      {/* ── Check-in + Reflection ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Pre-game check-in */}
        {checkin && (
          <GlassCard title="Pre-game Check-in">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoRow label="Mental state"  value={`${checkin.mentalState} / 5`} />
              <InfoRow label="Energy level"  value={`${checkin.energyLevel} / 5`} />
              {goalLabel && <InfoRow label="Goal" value={goalLabel} />}
              {checkin.plannedRoles?.length > 0 && (
                <InfoRow label="Roles" value={checkin.plannedRoles.join(", ")} />
              )}
              {checkin.championPool?.length > 0 && (
                <div className="col-span-2">
                  <InfoRow label="Champions" value={checkin.championPool.join(", ")} />
                </div>
              )}
              {checkin.stopCondition && (
                <div className="col-span-2 mt-1 flex items-start gap-2 px-3 py-2 rounded-lg bg-muted/20 border border-border/30">
                  <Flag className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Stop condition</p>
                    <p className="text-sm font-medium mt-0.5">{checkin.stopCondition}</p>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* Post-game reflection */}
        {reflection ? (
          <GlassCard title="Reflection">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
              <InfoRow label="Mental (end)"    value={`${reflection.mentalStateEnd} / 5`} />
              <InfoRow label="Overall rating"  value={`${reflection.overallRating} / 5`} />
              <InfoRow label="Tilt moments"    value={String(reflection.tiltMoments)} />
              <InfoRow
                label="Stop condition"
                value={reflection.followedStopCondition ? "Followed" : "Ignored"}
                positive={reflection.followedStopCondition}
              />
            </div>
            {reflection.whatWentWell && (
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15 mb-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">What went well</p>
                <p className="text-sm">{reflection.whatWentWell}</p>
              </div>
            )}
            {reflection.biggestMistake && (
              <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/15 mb-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Biggest mistake</p>
                <p className="text-sm">{reflection.biggestMistake}</p>
              </div>
            )}
            {reflection.improvementFocus && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/15">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Focus next session</p>
                <p className="text-sm">{reflection.improvementFocus}</p>
              </div>
            )}
          </GlassCard>
        ) : session.status === "completed" ? (
          <GlassCard title="Reflection">
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
              <p className="text-sm text-muted-foreground">No reflection logged yet</p>
              <Button asChild size="sm" variant="outline">
                <Link href={`/session/${sessionId}/reflect`}>Add Reflection</Link>
              </Button>
            </div>
          </GlassCard>
        ) : null}

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroStat({
  value, label, color, icon,
}: {
  value: string; label: string; color: string; icon?: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-0.5">{label}</p>
      <p className="text-2xl font-black tabular-nums leading-none flex items-center gap-1.5" style={{ color }}>
        {icon}
        {value}
      </p>
    </div>
  )
}

function GlassCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        background: "rgba(30,31,37,0.6)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(133,147,153,0.15)",
        borderTop: "1px solid rgba(133,147,153,0.2)",
      }}
    >
      <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">{title}</h2>
      {children}
    </div>
  )
}

function InfoRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn(
        "text-sm font-semibold mt-0.5",
        positive === true  ? "text-emerald-400" :
        positive === false ? "loss-text" :
        "text-foreground"
      )}>
        {value}
      </p>
    </div>
  )
}
