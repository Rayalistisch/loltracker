"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import {
  Trophy, X, TrendingUp, Brain,
  Flame, Flag, AlertTriangle, CheckCircle2, ChevronRight, Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { champIconUrl, champTileUrl } from "@/lib/utils/ddragon"

export interface RecapGame {
  id:        string
  result:    "win" | "loss"
  champion?: string
  kills?:    number
  deaths?:   number
  assists?:  number
  cs?:       number
  duration?: number  // seconds
  // Support extras
  visionScore?:        number
  wardsPlaced?:        number
  wardsKilled?:        number
  controlWardsPlaced?: number
  totalHeal?:          number
  totalShield?:        number
  ccScore?:            number  // seconds CC applied
  damageToChampions?:  number
}

export interface RecapSessionStats {
  wins:        number
  losses:      number
  totalGames:  number
  lossStreak:  number
  winStreak:   number
}

interface PostGameRecapProps {
  game:          RecapGame
  sessionStats:  RecapSessionStats
  stopCondition: string | null
  role?:         string          // primary role from checkin
  onContinue:    () => void
  onEndSession:  () => void
}

// ─── Rule-based insight engine ────────────────────────────────────────────────

type InsightLevel = "positive" | "neutral" | "warning" | "danger"

function getInsight(
  game:          RecapGame,
  stats:         RecapSessionStats,
  stopCondition: string | null,
): { message: string; level: InsightLevel } {
  const { lossStreak, winStreak, totalGames, wins, losses } = stats
  const wr = totalGames > 0 ? Math.round((wins / totalGames) * 100) : null

  // Stop condition
  if (stopCondition && lossStreak >= 3) {
    return {
      message: `Stop condition triggered: "${stopCondition}" — this is the moment to step away.`,
      level: "danger",
    }
  }

  // Win streaks
  if (winStreak >= 5) return { message: `${winStreak}-game win streak. You're completely locked in — keep the focus.`, level: "positive" }
  if (winStreak >= 3) return { message: `${winStreak} wins in a row. Momentum is on your side — ride it.`, level: "positive" }
  if (winStreak === 2) return { message: "Back-to-back wins. Good consistency — stay patient.", level: "positive" }

  // Loss streaks
  if (lossStreak >= 3) return { message: "3 losses in a row. Your mental state is at risk — take a break before queuing.", level: "danger" }
  if (lossStreak === 2) return { message: "Two consecutive losses. Step away for 5 minutes before the next game.", level: "warning" }

  // Individual game insights
  if (game.result === "win" && game.deaths === 0) {
    return { message: "Zero deaths — clean mechanical performance. That's the standard.", level: "positive" }
  }
  if (game.result === "loss" && game.deaths != null && game.deaths >= 10) {
    return { message: "High death count this game. Prioritise safer positioning next match.", level: "warning" }
  }
  if (game.result === "loss" && game.deaths != null && game.deaths >= 7) {
    return { message: "Too many deaths. Play for farm and vision rather than fighting when behind.", level: "warning" }
  }
  if (game.result === "win" && wr !== null && wr >= 70 && totalGames >= 4) {
    return { message: `${wr}% win rate over ${totalGames} games — exceptional session so far.`, level: "positive" }
  }
  if (game.result === "win") {
    return { message: "Solid game. Stay consistent and keep the same focus.", level: "positive" }
  }
  return { message: "One loss — reset mentally. The next game is a clean slate.", level: "neutral" }
}

// ─── Role-based next-game tip engine ─────────────────────────────────────────

interface RoleTip {
  tip:      string
  priority: "high" | "normal"  // high = shown in orange, normal = blue
}

function getRoleTip(role: string | undefined, game: RecapGame): RoleTip | null {
  const cs       = game.cs
  const deaths   = game.deaths ?? 0
  const kills    = game.kills ?? 0
  const assists  = game.assists ?? 0
  const duration = game.duration  // seconds
  const csPerMin = cs != null && duration ? cs / (duration / 60) : null
  const r        = (role ?? "").toUpperCase()

  // ── Support ────────────────────────────────────────────────────────────────
  if (r === "SUPPORT") {
    const visionScore = game.visionScore ?? null
    const wardsPlaced = game.wardsPlaced ?? null
    const ctrlWards   = game.controlWardsPlaced ?? null
    const healShield  = (game.totalHeal ?? 0) + (game.totalShield ?? 0)

    if (deaths >= 6)
      return { tip: "You died too often — stay behind your ADC and let them frontline engages.", priority: "high" }
    if (visionScore !== null && visionScore < 20)
      return { tip: `Vision score ${visionScore} is too low. Ward every back — tri-bush, river, pixel brush.`, priority: "high" }
    if (ctrlWards !== null && ctrlWards < 2)
      return { tip: "Buy a control ward every back. They cost 75 gold and deny enemy vision permanently.", priority: "high" }
    if (wardsPlaced !== null && wardsPlaced < 10)
      return { tip: `Only ${wardsPlaced} wards placed. Use ward trinket on cooldown and buy Sightstone early.`, priority: "high" }
    if (assists < 4 && kills < 3)
      return { tip: "Look for more engage opportunities. Roam mid after shoving bot with your ADC.", priority: "normal" }
    if (healShield > 0 && healShield < 3000)
      return { tip: "Low heal/shield output. Position closer to carry in teamfights to maximise your utility.", priority: "normal" }
    if (visionScore !== null && visionScore >= 50)
      return { tip: `Great vision score (${visionScore}). Keep warding high-priority objectives before they spawn.`, priority: "normal" }
    return { tip: "Ward river and tri-bush after every back. Vision control wins games before they start.", priority: "normal" }
  }

  // ── Jungle ────────────────────────────────────────────────────────────────
  if (r === "JUNGLE") {
    if (csPerMin !== null && csPerMin < 5)
      return { tip: `${csPerMin.toFixed(1)} CS/min — clear full camps before ganking. Target 5+ CS/min.`, priority: "high" }
    if (deaths >= 5)
      return { tip: "Don't invade without vision. Track enemy jungle by watching early camps.", priority: "high" }
    return { tip: "Set a timer for Dragon/Baron 30s before spawn and rally your team early.", priority: "normal" }
  }

  // ── Mid ───────────────────────────────────────────────────────────────────
  if (r === "MID") {
    if (csPerMin !== null && csPerMin < 6)
      return { tip: `${csPerMin.toFixed(1)} CS/min — shove wave first, then roam. Target 7+ CS/min.`, priority: "high" }
    if (deaths >= 5)
      return { tip: "Dying mid opens the whole map. Play safer — trade when you have prio.", priority: "high" }
    if (csPerMin !== null && csPerMin >= 8 && game.result === "win")
      return { tip: "Great CS. Next step: shove and roam to side lanes to create pick opportunities.", priority: "normal" }
    return { tip: "Shove the wave before you roam so you don't lose CS and pressure simultaneously.", priority: "normal" }
  }

  // ── Bot / ADC ─────────────────────────────────────────────────────────────
  if (r === "BOTTOM") {
    if (csPerMin !== null && csPerMin < 6)
      return { tip: `${csPerMin.toFixed(1)} CS/min — positioning in lane is hurting your farm. Target 8+ CS/min.`, priority: "high" }
    if (deaths >= 6)
      return { tip: "ADC deaths are costly — hug the backline in teamfights and peel for yourself.", priority: "high" }
    if (csPerMin !== null && csPerMin >= 8)
      return { tip: "Good CS numbers. Focus on positioning in mid-game teamfights — stay furthest from threats.", priority: "normal" }
    return { tip: "Prioritise CS over kills early. Every 15 CS missed equals one item delay.", priority: "normal" }
  }

  // ── Top ───────────────────────────────────────────────────────────────────
  if (r === "TOP") {
    if (csPerMin !== null && csPerMin < 6)
      return { tip: `${csPerMin.toFixed(1)} CS/min — top lane is a CS farm lane. Target 7+ CS/min.`, priority: "high" }
    if (deaths >= 5)
      return { tip: "Use Teleport defensively — save it for teamfights rather than aggressive flanks.", priority: "high" }
    return { tip: "After winning lane, push and rotate with TP. Your sidelane pressure is a macro tool.", priority: "normal" }
  }

  // ── Fill / unknown ────────────────────────────────────────────────────────
  if (csPerMin !== null && csPerMin < 5 && r !== "SUPPORT")
    return { tip: `${csPerMin.toFixed(1)} CS/min — improving CS is the fastest way to gain item advantages.`, priority: "high" }
  if (deaths >= 7)
    return { tip: "Focus on dying less — every death gives the enemy gold and map control.", priority: "high" }
  return null
}

// ─── Champion portrait ────────────────────────────────────────────────────────

function ChampPortrait({ name, isWin }: { name: string; isWin: boolean }) {
  const [err, setErr] = useState(false)
  const ring = isWin
    ? "ring-2 ring-[oklch(0.60_0.20_258/80%)] ring-offset-2 ring-offset-[oklch(0.08_0_0)]"
    : "ring-2 ring-[oklch(0.62_0.22_22/80%)] ring-offset-2 ring-offset-[oklch(0.08_0_0)]"

  if (err || !name) {
    return (
      <div className={cn(
        "w-20 h-20 rounded-lg shrink-0 flex items-center justify-center text-3xl font-black",
        ring,
        isWin
          ? "bg-[oklch(0.60_0.20_258/15%)] text-[oklch(0.72_0.18_258)]"
          : "bg-[oklch(0.62_0.22_22/15%)] text-[oklch(0.72_0.18_22)]"
      )}>
        {name?.[0] ?? "?"}
      </div>
    )
  }
  return (
    <Image
      src={champTileUrl(name)}
      alt={name}
      width={80}
      height={80}
      className={cn("w-20 h-20 rounded-lg shrink-0 object-cover object-[50%_10%]", ring)}
      onError={() => setErr(true)}
      unoptimized
    />
  )
}

// ─── Auto-dismiss progress bar ────────────────────────────────────────────────

const AUTO_DISMISS_SEC = 30

function CountdownBar({ onComplete }: { onComplete: () => void }) {
  const [remaining, setRemaining] = useState(AUTO_DISMISS_SEC)

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { onComplete(); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [onComplete])

  return (
    <div className="h-0.5 w-full bg-border/30 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-muted-foreground/30 rounded-full"
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: AUTO_DISMISS_SEC, ease: "linear" }}
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const LEVEL_STYLE: Record<InsightLevel, string> = {
  positive: "bg-emerald-500/10 border-emerald-500/25 text-emerald-300",
  neutral:  "bg-muted/40 border-border/40 text-muted-foreground",
  warning:  "bg-orange-500/10 border-orange-500/25 text-orange-300",
  danger:   "bg-red-500/10 border-red-500/30 text-red-300",
}

const LEVEL_ICON: Record<InsightLevel, React.ReactNode> = {
  positive: <CheckCircle2 className="h-4 w-4 shrink-0" />,
  neutral:  <Brain className="h-4 w-4 shrink-0" />,
  warning:  <AlertTriangle className="h-4 w-4 shrink-0" />,
  danger:   <Flame className="h-4 w-4 shrink-0" />,
}

export function PostGameRecap({
  game, sessionStats, stopCondition, role, onContinue, onEndSession,
}: PostGameRecapProps) {
  const insight  = getInsight(game, sessionStats, stopCondition)
  const roleTip  = getRoleTip(role, game)
  const { wins, losses, totalGames } = sessionStats
  const wr       = totalGames > 0 ? Math.round((wins / totalGames) * 100) : null
  const isWin    = game.result === "win"
  const kda      = game.kills != null ? `${game.kills} / ${game.deaths} / ${game.assists}` : null
  const stopNow  = insight.level === "danger"

  const cardBg = isWin
    ? "linear-gradient(135deg, oklch(0.60 0.20 258 / 16%) 0%, oklch(0.11 0 0) 55%)"
    : "linear-gradient(135deg, oklch(0.62 0.22 22 / 14%) 0%, oklch(0.11 0 0) 55%)"

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className="rounded-xl border border-border/50 overflow-hidden"
      style={{ background: cardBg, borderLeft: `3px solid ${isWin ? "oklch(0.60 0.20 258)" : "oklch(0.62 0.22 22)"}` }}
    >
      <CountdownBar onComplete={onContinue} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          {game.champion && <ChampPortrait name={game.champion} isWin={isWin} />}

          <div className="flex-1 min-w-0">
            {/* Result + champion */}
            <div className="flex items-center gap-2 mb-1">
              {isWin
                ? <Trophy className="h-4 w-4 win-text shrink-0" />
                : <X className="h-4 w-4 loss-text shrink-0" />
              }
              <span className={cn("text-base font-bold", isWin ? "win-text" : "loss-text")}>
                {isWin ? "Victory" : "Defeat"}
              </span>
              {game.champion && (
                <span className="text-sm text-foreground font-medium">— {game.champion}</span>
              )}
            </div>

            {/* KDA — for non-support show CS too */}
            {kda && (
              <p className="text-sm text-muted-foreground tabular-nums mb-2">
                {kda} KDA
                {game.cs != null && role?.toUpperCase() !== "SUPPORT" && (
                  <span className="ml-3">{game.cs} CS</span>
                )}
              </p>
            )}

            {/* Support-specific stats grid */}
            {role?.toUpperCase() === "SUPPORT" && (
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {game.visionScore != null && (
                  <SupportStat label="Vision" value={String(game.visionScore)} highlight={game.visionScore >= 40} />
                )}
                {game.wardsPlaced != null && (
                  <SupportStat label="Wards" value={String(game.wardsPlaced)} highlight={game.wardsPlaced >= 15} />
                )}
                {game.controlWardsPlaced != null && (
                  <SupportStat label="Control" value={String(game.controlWardsPlaced)} highlight={game.controlWardsPlaced >= 3} />
                )}
                {game.wardsKilled != null && (
                  <SupportStat label="Cleared" value={String(game.wardsKilled)} />
                )}
                {(game.totalHeal != null || game.totalShield != null) && (
                  <SupportStat
                    label="Heal+Shield"
                    value={formatBig((game.totalHeal ?? 0) + (game.totalShield ?? 0))}
                    highlight={((game.totalHeal ?? 0) + (game.totalShield ?? 0)) >= 5000}
                  />
                )}
                {game.ccScore != null && game.ccScore > 0 && (
                  <SupportStat label="CC Time" value={`${game.ccScore}s`} highlight={game.ccScore >= 30} />
                )}
              </div>
            )}

            {/* Session stats row */}
            <div className="flex items-center gap-5">
              <MiniStat
                icon={<TrendingUp className="h-3 w-3" />}
                value={`${wins}W — ${losses}L`}
                label="Session"
                positive={wins >= losses}
              />
              {wr !== null && (
                <MiniStat
                  value={`${wr}%`}
                  label="Win Rate"
                  positive={wr >= 50}
                />
              )}
              <MiniStat
                value={String(totalGames)}
                label="Games"
              />
            </div>
          </div>
        </div>

        {/* Insight */}
        <div className={cn(
          "mt-4 flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-sm",
          LEVEL_STYLE[insight.level]
        )}>
          {LEVEL_ICON[insight.level]}
          <p className="leading-snug">{insight.message}</p>
        </div>

        {/* Role-based tip */}
        {roleTip && (
          <div className={cn(
            "mt-3 flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-sm",
            roleTip.priority === "high"
              ? "bg-orange-500/8 border-orange-500/20 text-orange-200"
              : "bg-primary/8 border-primary/20 text-blue-200"
          )}>
            {roleTip.priority === "high"
              ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              : <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            }
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60 mb-0.5">
                Next game tip{role ? ` · ${role.charAt(0) + role.slice(1).toLowerCase()}` : ""}
              </p>
              <p className="leading-snug">{roleTip.tip}</p>
            </div>
          </div>
        )}

        {/* Stop condition display */}
        {stopCondition && !stopNow && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Flag className="h-3.5 w-3.5 shrink-0" />
            <span>Stop condition: {stopCondition}</span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          {stopNow ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-muted-foreground"
                onClick={onContinue}
              >
                Ignore & continue
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                onClick={onEndSession}
              >
                <Flag className="h-3.5 w-3.5 mr-1.5" />
                End session now
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-border/50 hover:border-primary/40"
                onClick={onEndSession}
              >
                End session
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-1.5"
                onClick={onContinue}
              >
                Continue
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function formatBig(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function SupportStat({
  label, value, highlight,
}: {
  label:      string
  value:      string
  highlight?: boolean
}) {
  return (
    <div className={cn(
      "rounded border px-2 py-1.5 text-center",
      highlight
        ? "border-emerald-500/25 bg-emerald-500/8"
        : "border-border/30 bg-muted/20"
    )}>
      <div className={cn(
        "text-sm font-bold tabular-nums",
        highlight ? "text-emerald-300" : "text-foreground"
      )}>
        {value}
      </div>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  )
}

function MiniStat({
  icon, value, label, positive,
}: {
  icon?: React.ReactNode
  value: string
  label: string
  positive?: boolean
}) {
  return (
    <div className="text-center">
      <div className={cn(
        "text-sm font-bold tabular-nums flex items-center gap-1",
        positive === true  ? "win-text" :
        positive === false ? "loss-text" :
        "text-foreground"
      )}>
        {icon}
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  )
}
