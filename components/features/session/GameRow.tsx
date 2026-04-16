"use client"

import Image from "next/image"
import { useState } from "react"
import { champIconUrl } from "@/lib/utils/ddragon"
import { cn } from "@/lib/utils"

interface Game {
  id: string
  result: "win" | "loss"
  champion: string | null
  kills: number | null
  deaths: number | null
  assists: number | null
  cs: number | null
  duration: number | null
  vision_score: number | null
  played_at: string | null
}

function ChampIcon({ name }: { name: string }) {
  const [error, setError] = useState(false)
  if (error || !name) {
    return (
      <div className="w-9 h-9 rounded border border-border/40 bg-muted/40 flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">
        {name?.[0] ?? "?"}
      </div>
    )
  }
  return (
    <Image
      src={champIconUrl(name)}
      alt={name}
      width={36}
      height={36}
      className="w-9 h-9 rounded border border-border/30 object-cover shrink-0"
      onError={() => setError(true)}
      unoptimized
      title={name}
    />
  )
}

export function GameRow({ game }: { game: Game }) {
  const isWin = game.result === "win"

  const kda =
    game.kills != null && game.deaths != null && game.assists != null
      ? `${game.kills} / ${game.deaths} / ${game.assists}`
      : null

  const kdaRatio =
    game.kills != null && game.deaths != null && game.assists != null && game.deaths > 0
      ? (((game.kills + game.assists) / game.deaths)).toFixed(2)
      : game.deaths === 0 && game.kills != null
      ? "Perfect"
      : null

  const durationMin = game.duration ? `${Math.floor(game.duration / 60)}:${String(game.duration % 60).padStart(2, "0")}` : null
  const csPerMin = game.cs != null && game.duration
    ? (game.cs / (game.duration / 60)).toFixed(1)
    : null

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded border",
        isWin
          ? "border-[oklch(0.60_0.20_258/25%)] bg-[oklch(0.60_0.20_258/8%)]"
          : "border-[oklch(0.62_0.22_22/25%)] bg-[oklch(0.62_0.22_22/8%)]"
      )}
      style={{ borderLeft: `3px solid ${isWin ? "oklch(0.60 0.20 258)" : "oklch(0.62 0.22 22)"}` }}
    >
      {/* Champion icon */}
      {game.champion && <ChampIcon name={game.champion} />}

      {/* Result + champion name */}
      <div className="w-20 shrink-0">
        <p className={cn("text-xs font-bold", isWin ? "win-text" : "loss-text")}>
          {isWin ? "Victory" : "Defeat"}
        </p>
        {game.champion && (
          <p className="text-[11px] text-muted-foreground truncate">{game.champion}</p>
        )}
      </div>

      {/* KDA */}
      {kda && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold tabular-nums text-foreground">{kda}</p>
          {kdaRatio && (
            <p className={cn(
              "text-[11px] font-medium",
              kdaRatio === "Perfect"
                ? "text-yellow-400"
                : parseFloat(kdaRatio) >= 4
                ? "win-text"
                : parseFloat(kdaRatio) < 2
                ? "loss-text"
                : "text-muted-foreground"
            )}>
              {kdaRatio === "Perfect" ? "Perfect KDA" : `${kdaRatio} KDA`}
            </p>
          )}
        </div>
      )}

      {/* CS */}
      {game.cs != null && (
        <div className="text-right shrink-0">
          <p className="text-xs font-semibold text-foreground tabular-nums">{game.cs} CS</p>
          {csPerMin && (
            <p className="text-[11px] text-muted-foreground">{csPerMin}/min</p>
          )}
        </div>
      )}

      {/* Duration */}
      {durationMin && (
        <div className="text-right shrink-0 w-12">
          <p className="text-xs text-muted-foreground">{durationMin}</p>
        </div>
      )}
    </div>
  )
}
