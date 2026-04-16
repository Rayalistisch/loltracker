import { format, formatDistanceToNow, differenceInMinutes } from "date-fns"
import type { Rank, Division } from "@/types/enums"

// ─── Date formatting ──────────────────────────────────────────────────────────

export function formatDate(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy")
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy 'at' HH:mm")
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDuration(startedAt: string, endedAt?: string | null): string {
  const start = new Date(startedAt)
  const end = endedAt ? new Date(endedAt) : new Date()
  const minutes = differenceInMinutes(end, start)

  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}m`
}

/** Format a duration given in whole seconds */
export function formatDurationSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}m`
}

export function formatSessionTimer(startedAt: string): string {
  const minutes = differenceInMinutes(new Date(), new Date(startedAt))
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

/** Format elapsed seconds as HH:MM:SS */
export function formatElapsedSeconds(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function formatWeekLabel(weekStart: string): string {
  return format(new Date(weekStart), "MMM d")
}

// ─── Rank formatting ──────────────────────────────────────────────────────────

const RANK_ORDER: Rank[] = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
]

export function formatRank(rank: string | null): string {
  if (!rank) return "Unranked"
  return rank
    .split(" ")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ")
}

export function rankToIndex(tier: Rank, division?: Division): number {
  const tierIdx = RANK_ORDER.indexOf(tier)
  const divMap: Record<Division, number> = { IV: 0, III: 1, II: 2, I: 3 }
  const divIdx = division ? divMap[division] : 0
  return tierIdx * 4 + divIdx
}

export function rankDistance(
  a: { tier: Rank; division?: Division },
  b: { tier: Rank; division?: Division }
): number {
  return Math.abs(rankToIndex(a.tier, a.division) - rankToIndex(b.tier, b.division))
}

export function getRankClass(rank: Rank): string {
  const map: Record<Rank, string> = {
    IRON: "rank-iron",
    BRONZE: "rank-bronze",
    SILVER: "rank-silver",
    GOLD: "rank-gold",
    PLATINUM: "rank-platinum",
    EMERALD: "rank-emerald",
    DIAMOND: "rank-diamond",
    MASTER: "rank-master",
    GRANDMASTER: "rank-grandmaster",
    CHALLENGER: "rank-challenger",
  }
  return map[rank]
}

// ─── Number formatting ────────────────────────────────────────────────────────

export function formatLP(lp: number | null | undefined): string {
  if (lp == null) return "—"
  return lp >= 0 ? `+${lp} LP` : `${lp} LP`
}

export function formatWinrate(wins: number, games: number): string {
  if (games === 0) return "0%"
  return `${Math.round((wins / games) * 100)}%`
}

export function formatScore(score: number): string {
  return Math.round(score).toString()
}

// ─── Role label ───────────────────────────────────────────────────────────────

export function formatRole(role: string): string {
  const map: Record<string, string> = {
    TOP: "Top",
    JUNGLE: "Jungle",
    MID: "Mid",
    BOTTOM: "Bot",
    SUPPORT: "Support",
    FILL: "Fill",
  }
  return map[role] ?? role
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1) + "…"
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
