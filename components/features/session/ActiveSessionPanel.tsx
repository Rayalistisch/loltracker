"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play, Pause, Trophy, X, Flame, Clock, Target,
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle2, Flag, Zap, RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { champIconUrl } from "@/lib/utils/ddragon"
import type { PlayerSession, PreGameCheckin } from "@/types/domain"
import { formatElapsedSeconds } from "@/lib/utils/format"
import type { MatchSummary } from "@/services/riot.service"
import { PostGameRecap, type RecapGame } from "./PostGameRecap"

interface ActiveSessionPanelProps {
  session:  PlayerSession
  checkin:  PreGameCheckin
  hasRiotId: boolean
}

interface GameEntry {
  id:        string
  result:    "win" | "loss"
  source:    "auto" | "manual"
  champion?: string
  kills?:    number
  deaths?:   number
  assists?:  number
  cs?:       number
}

const POLL_INTERVAL_MS = 60_000 // 60 seconds

function ChampMini({ name }: { name: string }) {
  const [err, setErr] = useState(false)
  if (err || !name) {
    return (
      <div className="w-7 h-7 rounded bg-muted/40 flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
        {name?.[0] ?? "?"}
      </div>
    )
  }
  return (
    <Image
      src={champIconUrl(name)}
      alt={name}
      width={28}
      height={28}
      className="w-7 h-7 rounded shrink-0 object-cover"
      onError={() => setErr(true)}
      unoptimized
    />
  )
}

export function ActiveSessionPanel({ session, checkin, hasRiotId }: ActiveSessionPanelProps) {
  const router  = useRouter()
  const [elapsed, setElapsed]           = useState(0)
  const [isRunning, setIsRunning]       = useState(true)
  const [games, setGames]               = useState<GameEntry[]>([])
  const [loading, setLoading]           = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [polling, setPolling]           = useState(false)
  const [recap, setRecap]               = useState<RecapGame | null>(null)
  const seenMatchIds                    = useRef<Set<string>>(new Set())

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const startedAt = session.startedAt ? new Date(session.startedAt).getTime() : Date.now()
    const update = () => {
      if (isRunning) setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [isRunning, session.startedAt])

  // ── Riot API polling ──────────────────────────────────────────────────────
  const fetchNewMatches = useCallback(async (silent = false) => {
    if (!hasRiotId) return
    if (!silent) setPolling(true)
    try {
      const res = await fetch(`/api/riot/recent-matches?sessionId=${session.id}`)
      if (!res.ok) return
      const { matches }: { matches: MatchSummary[] } = await res.json()

      const fresh = matches.filter((m) => !seenMatchIds.current.has(m.matchId))
      if (fresh.length === 0) return

      fresh.forEach((m) => {
        seenMatchIds.current.add(m.matchId)
        const entry: GameEntry = {
          id:       m.matchId,
          result:   m.win ? "win" : "loss",
          source:   "auto",
          champion: m.champion,
          kills:    m.kills,
          deaths:   m.deaths,
          assists:  m.assists,
          cs:       m.cs,
        }
        setGames((prev) => {
          if (prev.find((g) => g.id === m.matchId)) return prev
          return [...prev, entry]
        })

        // Show recap for the last detected game (if multiple, show the most recent)
        setRecap({
          id:       m.matchId,
          result:   m.win ? "win" : "loss",
          champion: m.champion,
          kills:    m.kills,
          deaths:   m.deaths,
          assists:  m.assists,
          cs:       m.cs,
          duration: m.duration,
        })
      })
    } catch {
      // silent failure — don't interrupt the session
    } finally {
      setPolling(false)
    }
  }, [session.id, hasRiotId])

  // Initial fetch + interval
  useEffect(() => {
    if (!hasRiotId) return
    fetchNewMatches(true)
    const id = setInterval(() => fetchNewMatches(true), POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchNewMatches, hasRiotId])

  // ── Derived stats ─────────────────────────────────────────────────────────
  const wins       = games.filter((g) => g.result === "win").length
  const losses     = games.filter((g) => g.result === "loss").length
  const totalGames = games.length
  const planned    = checkin.plannedGames
  const winRate    = totalGames > 0 ? Math.round((wins / totalGames) * 100) : null

  const recentGames = [...games].reverse()
  let lossStreak = 0
  for (const g of recentGames) {
    if (g.result === "loss") lossStreak++
    else break
  }
  let winStreak = 0
  for (const g of recentGames) {
    if (g.result === "win") winStreak++
    else break
  }

  const tiltLevel =
    lossStreak >= 3   ? "high" :
    lossStreak >= 2   ? "medium" :
    elapsed > 10_800  ? "medium" : // 3h
    "low"

  // ── Manual add ───────────────────────────────────────────────────────────
  function addManual(result: "win" | "loss") {
    const id = `manual-${Date.now()}`
    const entry: GameEntry = { id, result, source: "manual" }
    setGames((prev) => [...prev, entry])
    setRecap({ id, result })
  }

  // ── End session ──────────────────────────────────────────────────────────
  const handleEndSession = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/session/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gamesWon: wins, gamesLost: losses, actualGames: totalGames }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      router.push(`/session/${session.id}/reflect`)
    } catch {
      toast.error("Failed to save session. Try again.")
    } finally {
      setLoading(false)
    }
  }, [session.id, wins, losses, totalGames, router])

  const recapStats = { wins, losses, totalGames, lossStreak, winStreak }

  return (
    <div className="space-y-4">
      {/* ── Post-game recap overlay ───────────────────────────────────────── */}
      <AnimatePresence>
        {recap && (
          <PostGameRecap
            game={recap}
            sessionStats={recapStats}
            stopCondition={checkin.stopCondition}
            role={checkin.plannedRoles?.[0]}
            onContinue={() => setRecap(null)}
            onEndSession={() => {
              setRecap(null)
              setShowEndConfirm(true)
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Main tracker card ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        {/* Header: live indicator + timer */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className={cn("w-2.5 h-2.5 rounded-full", isRunning ? "bg-emerald-400" : "bg-yellow-400")} />
              {isRunning && (
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-60" />
              )}
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {isRunning ? "Session live" : "Paused"}
            </span>
            {hasRiotId && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60 ml-1">
                <Zap className="h-3 w-3" />
                Auto-detect
                {polling && <RefreshCw className="h-3 w-3 animate-spin" />}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsRunning((v) => !v)} className="h-8 w-8">
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatBox icon={<Clock className="h-3.5 w-3.5" />} label="Time" value={formatElapsedSeconds(elapsed)} />
          <StatBox
            icon={<Target className="h-3.5 w-3.5" />}
            label="Games"
            value={`${totalGames}`}
            sub={`/ ${planned} planned`}
          />
          <StatBox
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="Win Rate"
            value={winRate !== null ? `${winRate}%` : "—"}
            positive={winRate !== null ? winRate >= 50 : undefined}
          />
        </div>

        {/* Win / Loss buttons (manual fallback) */}
        {!hasRiotId && (
          <div className="flex gap-3 mb-4">
            <Button
              variant="outline"
              className="flex-1 h-12 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-400 gap-2 font-semibold"
              onClick={() => addManual("win")}
            >
              <Trophy className="h-4 w-4" />
              Win
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10 text-red-400 gap-2 font-semibold"
              onClick={() => addManual("loss")}
            >
              <X className="h-4 w-4" />
              Loss
            </Button>
          </div>
        )}

        {/* Manual override when Riot ID is connected */}
        {hasRiotId && (
          <div className="flex gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/10 gap-1"
              onClick={() => addManual("win")}
            >
              <Trophy className="h-3.5 w-3.5" /> +Win manually
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10 gap-1"
              onClick={() => addManual("loss")}
            >
              <X className="h-3.5 w-3.5" /> +Loss manually
            </Button>
          </div>
        )}

        {/* Game history */}
        {games.length > 0 && (
          <div className="space-y-1.5 mb-4">
            <AnimatePresence initial={false}>
              {games.map((game) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded border",
                    game.result === "win"
                      ? "bg-[oklch(0.60_0.20_258/10%)] border-[oklch(0.60_0.20_258/20%)]"
                      : "bg-[oklch(0.62_0.22_22/10%)] border-[oklch(0.62_0.22_22/20%)]"
                  )}
                >
                  {game.champion && <ChampMini name={game.champion} />}
                  <span className={cn(
                    "text-xs font-bold w-10 shrink-0",
                    game.result === "win" ? "win-text" : "loss-text"
                  )}>
                    {game.result === "win" ? "Win" : "Loss"}
                  </span>
                  {game.champion && (
                    <span className="text-xs text-foreground font-medium">{game.champion}</span>
                  )}
                  {game.kills != null && (
                    <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                      {game.kills}/{game.deaths}/{game.assists}
                      {game.cs != null && <span className="ml-2">{game.cs} CS</span>}
                    </span>
                  )}
                  {game.source === "manual" && (
                    <span className="text-[9px] text-muted-foreground/50 ml-1">manual</span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* W/L summary */}
        {totalGames > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 win-text font-semibold">
              <TrendingUp className="h-4 w-4" />{wins}W
            </span>
            <span className="text-muted-foreground">—</span>
            <span className="flex items-center gap-1.5 loss-text font-semibold">
              <TrendingDown className="h-4 w-4" />{losses}L
            </span>
            {lossStreak >= 2 && (
              <span className="ml-auto flex items-center gap-1 text-orange-400 text-xs font-medium">
                <Flame className="h-3.5 w-3.5" />{lossStreak} loss streak
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── No Riot ID notice ─────────────────────────────────────────────── */}
      {!hasRiotId && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-foreground">Connect Riot ID for auto-detection</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Without a Riot ID, log wins and losses manually above.
            </p>
          </div>
        </div>
      )}

      {/* ── Tilt warning ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {tiltLevel !== "low" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "rounded-xl border p-4 flex items-start gap-3",
              tiltLevel === "high"
                ? "bg-red-500/10 border-red-500/30"
                : "bg-orange-500/10 border-orange-500/30"
            )}
          >
            <AlertTriangle className={cn("h-4 w-4 mt-0.5 shrink-0", tiltLevel === "high" ? "text-red-400" : "text-orange-400")} />
            <div>
              <p className={cn("font-semibold text-sm", tiltLevel === "high" ? "text-red-400" : "text-orange-400")}>
                {tiltLevel === "high" ? "High tilt risk" : "Tilt warning"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lossStreak >= 3
                  ? "3 losses in a row. Check your stop condition."
                  : lossStreak >= 2
                  ? "2 consecutive losses. Stay focused."
                  : "You've been playing for over 3 hours."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stop condition ───────────────────────────────────────────────── */}
      {checkin.stopCondition && (
        <div className="rounded-xl border border-border/60 bg-card p-4 flex items-start gap-2.5">
          <Flag className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Stop condition</p>
            <p className="text-sm text-foreground">{checkin.stopCondition}</p>
          </div>
        </div>
      )}

      {/* ── Session plan ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded border border-border/40 bg-card/60 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Goal</p>
          <p className="text-sm font-medium capitalize">{checkin.goal.replace(/-/g, " ")}</p>
        </div>
        <div className="rounded border border-border/40 bg-card/60 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Roles</p>
          <p className="text-sm font-medium">{checkin.plannedRoles.length > 0 ? checkin.plannedRoles.join(", ") : "Any"}</p>
        </div>
        {checkin.championPool.length > 0 && (
          <div className="col-span-2 rounded border border-border/40 bg-card/60 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Champions</p>
            <div className="flex items-center gap-1.5">
              {checkin.championPool.map((c) => <ChampMini key={c} name={c} />)}
            </div>
          </div>
        )}
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      {planned > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Session progress</span>
            <span>{totalGames}/{planned} games</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((totalGames / planned) * 100, 100)}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
          {totalGames >= planned && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              You've hit your planned {planned} games
            </div>
          )}
        </div>
      )}

      {/* ── End session ──────────────────────────────────────────────────── */}
      <div className="pt-2">
        {!showEndConfirm ? (
          <Button
            variant="outline"
            className="w-full border-border/60 hover:border-primary/50 hover:bg-primary/5"
            onClick={() => setShowEndConfirm(true)}
          >
            End Session & Reflect
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3"
          >
            <p className="text-sm font-medium">
              End session with {totalGames} game{totalGames !== 1 ? "s" : ""}?
            </p>
            <p className="text-xs text-muted-foreground">
              You'll fill in a quick reflection to complete your session.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowEndConfirm(false)} className="flex-1">
                Cancel
              </Button>
              <Button size="sm" onClick={handleEndSession} disabled={loading} className="flex-1">
                {loading ? "Saving…" : "End & Reflect"}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function StatBox({
  icon, label, value, sub, positive,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  positive?: boolean
}) {
  return (
    <div className="rounded border border-border/40 bg-card/60 p-3 text-center">
      <div className="flex items-center justify-center gap-1 mb-1 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <div className={cn(
        "text-xl font-bold tabular-nums",
        positive === true ? "win-text" : positive === false ? "loss-text" : "text-foreground"
      )}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}
