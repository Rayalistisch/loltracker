"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Lock, Flame, AlertTriangle, TrendingUp, Shield, Target, Zap } from "lucide-react"
import { champTileUrl } from "@/lib/utils/ddragon"
import { formatDurationSeconds, formatRelative } from "@/lib/utils/format"
import { SESSION_GOALS } from "@/lib/utils/lol-constants"
import type { PlayerSession } from "@/types/domain"

// ─── Tilt badge config ────────────────────────────────────────────────────────

const TILT_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  "locked-in":        { label: "Locked In",  color: "#34d399", icon: <Lock   className="h-3 w-3" /> },
  "stable":           { label: "Stable",     color: "#60a5fa", icon: <Shield className="h-3 w-3" /> },
  "slipping":         { label: "Slipping",   color: "#fbbf24", icon: <Zap    className="h-3 w-3" /> },
  "tilted":           { label: "Tilted",     color: "#f97316", icon: <Flame  className="h-3 w-3" /> },
  "stop-recommended": { label: "Stop",       color: "#f87171", icon: <AlertTriangle className="h-3 w-3" /> },
}

// ─── Champion portrait ────────────────────────────────────────────────────────

function ChampPortrait({ name, isWin }: { name: string; isWin: boolean }) {
  const [err, setErr] = useState(false)
  const accent = isWin ? "#4cd6ff" : "#f87171"

  if (err || !name) {
    return (
      <div
        className="w-20 h-20 flex items-center justify-center text-2xl font-black border transition-transform duration-300 rotate-3 group-hover:rotate-0"
        style={{ background: `${accent}12`, borderColor: `${accent}30`, color: accent }}
      >
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
      className="w-20 h-20 object-cover object-[50%_10%] transition-transform duration-300 rotate-3 group-hover:rotate-0"
      onError={() => setErr(true)}
      unoptimized
      title={name}
    />
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function KineticSessionCard({
  session,
  topChampion,
}: {
  session: PlayerSession
  topChampion?: string
}) {
  const wins   = session.gamesWon   ?? 0
  const losses = session.gamesLost  ?? 0
  const total  = session.actualGames ?? wins + losses
  const isWin  = wins >= losses && total > 0
  const accent = isWin ? "#4cd6ff" : "#f87171"

  const primaryChamp = session.preCheckin?.championPool?.[0] ?? topChampion ?? null

  const goalLabel = session.preCheckin?.goal
    ? SESSION_GOALS.find(g => g.value === session.preCheckin!.goal)?.label
    : null

  const mental = session.preCheckin?.mentalState ?? null

  const durationSec = session.startedAt && session.endedAt
    ? Math.floor((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
    : null

  const tiltKey =
    session.tiltScore == null ? null :
    session.tiltScore <= 25   ? "locked-in" :
    session.tiltScore <= 50   ? "stable"    :
    session.tiltScore <= 70   ? "slipping"  :
    session.tiltScore <= 85   ? "tilted"    :
    "stop-recommended"
  const tiltCfg = tiltKey ? TILT_CFG[tiltKey] : null

  return (
    <Link href={`/session/${session.id}`} className="relative overflow-hidden group block">

      {/* Hover glow overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `linear-gradient(to right, ${accent}08, transparent 60%)` }}
      />

      {/* Glass panel */}
      <div
        className="flex items-stretch"
        style={{
          background: "rgba(30,31,37,0.7)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(133,147,153,0.12)",
          borderRight: "1px solid rgba(133,147,153,0.06)",
          borderBottom: "1px solid rgba(133,147,153,0.06)",
        }}
      >
        {/* Left status bar */}
        <div
          className="w-3 shrink-0 transition-all duration-300"
          style={{
            background: accent,
            boxShadow: `0 0 0 0 ${accent}`,
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.boxShadow = `0 0 12px 2px ${accent}60`
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.boxShadow = "none"
          }}
        />

        {/* Content */}
        <div className="flex-1 px-6 py-5 flex flex-col sm:flex-row items-center gap-6">

          {/* Champion portrait */}
          <div
            className="relative shrink-0 overflow-hidden border"
            style={{ borderColor: `${accent}30` }}
          >
            <ChampPortrait name={primaryChamp ?? ""} isWin={isWin} />
            {/* V / D badge */}
            <div
              className="absolute -bottom-2.5 -right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black border"
              style={{ background: "#111318", borderColor: `${accent}60`, color: accent }}
            >
              {isWin ? "V" : "D"}
            </div>
          </div>

          {/* Core stats */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-xs font-black tracking-tighter uppercase" style={{ color: accent }}>
                {isWin ? "VICTORY" : "DEFEAT"}
              </span>
              {durationSec !== null && (
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {formatDurationSeconds(durationSec)}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider sm:ml-auto">
                {formatRelative(session.createdAt)}
              </span>
            </div>

            {/* W/L + mental stars */}
            <div className="flex items-end gap-6 flex-wrap">
              <div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{wins} / {losses}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-0.5">
                  W — L
                </p>
              </div>

              {mental !== null && (
                <>
                  <div className="h-7 w-px mb-1" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <div>
                    <div className="flex gap-0.5 mb-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <span
                          key={i}
                          className="text-sm leading-none"
                          style={{ color: i <= mental ? accent : "rgba(255,255,255,0.12)" }}
                        >★</span>
                      ))}
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                      Mental {mental}/5
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action badges */}
          <div className="flex gap-2 shrink-0 flex-wrap">
            {goalLabel && (
              <div
                className="px-4 py-2 border text-xs font-black tracking-wider uppercase flex items-center gap-2"
                style={{ borderColor: `${accent}30`, color: accent, background: `${accent}08` }}
              >
                <Target className="h-3 w-3" />
                {goalLabel}
              </div>
            )}
            {tiltCfg && (
              <div
                className="px-4 py-2 border text-xs font-black tracking-wider uppercase flex items-center gap-2"
                style={{
                  borderColor: `${tiltCfg.color}35`,
                  color: tiltCfg.color,
                  background: `${tiltCfg.color}08`,
                }}
              >
                {tiltCfg.icon}
                {tiltCfg.label}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
