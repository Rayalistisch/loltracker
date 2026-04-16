"use client"

import Link from "next/link"
import Image from "next/image"
import { formatRelative, formatDurationSeconds } from "@/lib/utils/format"
import { cn } from "@/lib/utils"
import { champIconUrl, champTileUrl } from "@/lib/utils/ddragon"
import { SESSION_GOALS } from "@/lib/utils/lol-constants"
import type { PlayerSession } from "@/types/domain"
import { useState } from "react"

interface SessionCardProps {
  session: PlayerSession
}

const TILT_LABEL: Record<string, { label: string; cls: string }> = {
  "locked-in":        { label: "Locked In",  cls: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" },
  "stable":           { label: "Stable",      cls: "bg-blue-400/10 text-blue-400 border-blue-400/20" },
  "slipping":         { label: "Slipping",    cls: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" },
  "tilted":           { label: "Tilted",      cls: "bg-orange-400/10 text-orange-400 border-orange-400/20" },
  "stop-recommended": { label: "Stop",        cls: "bg-red-400/10 text-red-400 border-red-400/20" },
}

function ChampIcon({ name, size = 32 }: { name: string; size?: number }) {
  const [error, setError] = useState(false)
  if (error) {
    return (
      <div
        className="rounded border border-border/40 bg-muted/40 flex items-center justify-center shrink-0 text-[10px] font-bold text-muted-foreground"
        style={{ width: size, height: size }}
      >
        {name[0]}
      </div>
    )
  }
  return (
    <Image
      src={champIconUrl(name)}
      alt={name}
      width={size}
      height={size}
      className="rounded border border-border/30 shrink-0 object-cover"
      onError={() => setError(true)}
      unoptimized
      title={name}
    />
  )
}

function ChampPortrait({ name, isWin }: { name: string; isWin: boolean }) {
  const [error, setError] = useState(false)

  const ringCls = isWin
    ? "ring-2 ring-offset-1 ring-offset-[oklch(0.11_0_0)] ring-[oklch(0.60_0.20_258/80%)]"
    : "ring-2 ring-offset-1 ring-offset-[oklch(0.11_0_0)] ring-[oklch(0.62_0.22_22/80%)]"

  if (error || !name) {
    return (
      <div className={cn(
        "w-[80px] h-[80px] rounded shrink-0 flex items-center justify-center text-2xl font-black",
        ringCls,
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
      className={cn("w-[80px] h-[80px] rounded shrink-0 object-cover object-[50%_10%]", ringCls)}
      onError={() => setError(true)}
      unoptimized
    />
  )
}

export function SessionCard({ session }: SessionCardProps) {
  const wins    = session.gamesWon ?? 0
  const losses  = session.gamesLost ?? 0
  const total   = session.actualGames ?? wins + losses
  const winRate = total > 0 ? Math.round((wins / total) * 100) : null
  const isWin   = wins >= losses && total > 0
  const lpDelta = session.lpDelta

  const durationSeconds = session.startedAt && session.endedAt
    ? Math.floor((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
    : null

  const tiltStatus =
    session.tiltScore == null ? null :
    session.tiltScore <= 25   ? "locked-in" :
    session.tiltScore <= 50   ? "stable" :
    session.tiltScore <= 70   ? "slipping" :
    session.tiltScore <= 85   ? "tilted" :
    "stop-recommended"
  const tiltCfg = tiltStatus ? TILT_LABEL[tiltStatus] : null

  const championPool = session.preCheckin?.championPool ?? []
  const primaryChamp = championPool[0] ?? null
  const goal         = session.preCheckin?.goal ?? null
  const goalLabel    = goal ? SESSION_GOALS.find(g => g.value === goal)?.label : null
  const mentalState  = session.preCheckin?.mentalState ?? null

  const leftBorderColor = isWin
    ? "oklch(0.60 0.20 258)"
    : "oklch(0.62 0.22 22)"

  const cardBg = isWin
    ? "linear-gradient(105deg, oklch(0.60 0.20 258 / 20%) 0%, oklch(0.11 0 0) 50%)"
    : "linear-gradient(105deg, oklch(0.62 0.22 22 / 16%) 0%, oklch(0.11 0 0) 50%)"

  return (
    <Link
      href={`/session/${session.id}`}
      className="flex items-stretch rounded overflow-hidden border border-border/30 hover:border-border/60 hover:brightness-105 transition-all duration-150"
      style={{
        background: cardBg,
        borderLeft: `3px solid ${leftBorderColor}`,
      }}
    >
      {/* Champion portrait */}
      <div className="flex items-center justify-center px-4 py-4 shrink-0">
        <ChampPortrait name={primaryChamp ?? ""} isWin={isWin} />
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-border/20 my-3 shrink-0" />

      {/* Main content */}
      <div className="flex-1 min-w-0 px-5 py-4 flex flex-col justify-between gap-2">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-sm font-bold tracking-wide", isWin ? "win-text" : "loss-text")}>
            {isWin ? "Victory" : "Defeat"}
          </span>
          <span className="text-border/60 text-xs">·</span>
          <span className="text-xs text-muted-foreground">Ranked Solo</span>
          {durationSeconds !== null && (
            <>
              <span className="text-border/60 text-xs">·</span>
              <span className="text-xs text-muted-foreground">{formatDurationSeconds(durationSeconds)}</span>
            </>
          )}
          <span className="text-border/60 text-xs">·</span>
          <span className="text-xs text-muted-foreground">{formatRelative(session.createdAt)}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pr-4">
          <StatCol
            value={`${wins} / ${losses}`}
            label="W — L"
            positive={isWin}
          />
          <StatCol
            value={winRate !== null ? `${winRate}%` : "—"}
            label="Win Rate"
            positive={winRate !== null ? winRate >= 50 : undefined}
          />
          <StatCol
            value={lpDelta != null ? `${lpDelta > 0 ? "+" : ""}${lpDelta}` : "—"}
            label="LP"
            positive={lpDelta != null ? lpDelta > 0 : undefined}
          />
          {mentalState !== null && (
            <StatCol
              value={`${mentalState} / 5`}
              label="Mental"
              positive={mentalState >= 4}
            />
          )}
          <StatCol
            value={String(total)}
            label="Games"
          />
        </div>

        {/* Champion icons + badges */}
        <div className="flex items-center gap-3 flex-wrap">
          {championPool.length > 0 && (
            <div className="flex items-center gap-1.5">
              {championPool.slice(0, 5).map((champ) => (
                <ChampIcon key={champ} name={champ} size={32} />
              ))}
            </div>
          )}

          {goalLabel && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded border bg-primary/10 border-primary/25 text-[13px] font-semibold text-primary">
              {goalLabel}
            </span>
          )}

          {tiltCfg && (
            <span className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded border text-[13px] font-semibold",
              tiltCfg.cls
            )}>
              {tiltCfg.label}
            </span>
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            {session.preCheckin && (
              <div className="w-2 h-2 rounded bg-primary/50" title="Check-in logged" />
            )}
            {session.postReflection && (
              <div className="w-2 h-2 rounded bg-emerald-500/50" title="Reflection logged" />
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function StatCol({
  value,
  label,
  positive,
}: {
  value: string
  label: string
  positive?: boolean
}) {
  return (
    <div className="text-center">
      <p className={cn(
        "text-sm font-bold tabular-nums leading-snug",
        positive === true  ? "win-text" :
        positive === false ? "loss-text" :
        "text-foreground"
      )}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 uppercase tracking-wide">{label}</p>
    </div>
  )
}
