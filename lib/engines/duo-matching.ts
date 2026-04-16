import type { DuoProfile, DuoMatchCandidate, CompatibilityBreakdown } from "@/types/domain"
import type { Rank, Role, Division } from "@/types/enums"
import { ROLE_SYNERGY } from "@/lib/utils/lol-constants"

// ─── Rank order ────────────────────────────────────────────────────────────────

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

const DIVISION_MAP: Record<Division, number> = { IV: 0, III: 1, II: 2, I: 3 }

function rankStringToIndex(rankStr: string | null): number | null {
  if (!rankStr) return null
  const parts = rankStr.trim().toUpperCase().split(" ")
  const tier = parts[0] as Rank
  const division = parts[1] as Division | undefined
  const tierIdx = RANK_ORDER.indexOf(tier)
  if (tierIdx === -1) return null
  const divIdx = division ? (DIVISION_MAP[division] ?? 0) : 0
  return tierIdx * 4 + divIdx
}

// ─── Availability overlap ──────────────────────────────────────────────────────

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"

function computeAvailabilityOverlap(
  a: Partial<Record<DayKey, number[]>>,
  b: Partial<Record<DayKey, number[]>>
): number {
  const days: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
  let overlap = 0
  let totalA = 0

  for (const day of days) {
    const hoursA = new Set(a[day] ?? [])
    const hoursB = new Set(b[day] ?? [])
    totalA += hoursA.size
    for (const hour of hoursA) {
      if (hoursB.has(hour)) overlap++
    }
  }

  if (totalA === 0) return 50 // no availability set → neutral
  return Math.round((overlap / totalA) * 100)
}

// ─── Vibe / tag Jaccard similarity ────────────────────────────────────────────

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 50 // both empty → neutral
  const setA = new Set(a)
  const setB = new Set(b)
  const intersection = [...setA].filter((x) => setB.has(x)).length
  const union = new Set([...setA, ...setB]).size
  if (union === 0) return 50
  return Math.round((intersection / union) * 100)
}

// ─── Main scoring ──────────────────────────────────────────────────────────────

export interface DuoScoringInput {
  viewer: DuoProfile
  candidates: DuoProfile[]
  weights?: {
    rank: number
    role: number
    availability: number
    vibe: number
    communication: number
  }
}

const DEFAULT_WEIGHTS = {
  rank: 0.25,
  role: 0.30,
  availability: 0.20,
  vibe: 0.15,
  communication: 0.10,
}

export function scoreDuoCandidates(input: DuoScoringInput): DuoMatchCandidate[] {
  const weights = input.weights ?? DEFAULT_WEIGHTS
  const userRankIdx = rankStringToIndex(input.viewer.profile?.currentRank ?? null)

  return input.candidates
    .map((candidate) => {
      const breakdown = computeBreakdown(input.viewer, candidate, userRankIdx, weights)
      const total = Math.round(
        breakdown.rankScore * weights.rank +
          breakdown.roleScore * weights.role +
          breakdown.availabilityScore * weights.availability +
          breakdown.vibeScore * weights.vibe +
          breakdown.communicationScore * weights.communication
      )

      return {
        ...candidate,
        compatibilityScore: Math.max(0, Math.min(100, total)),
        scoreBreakdown: breakdown,
      }
    })
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
}

function computeBreakdown(
  user: DuoProfile,
  candidate: DuoProfile,
  userRankIdx: number | null,
  weights: typeof DEFAULT_WEIGHTS
): CompatibilityBreakdown {
  // ─── Rank score ─────────────────────────────────────────────────────────────
  let rankScore = 50 // default neutral
  const candidateRankIdx = rankStringToIndex(candidate.profile?.currentRank ?? null)
  if (userRankIdx !== null && candidateRankIdx !== null) {
    const distance = Math.abs(userRankIdx - candidateRankIdx)
    // 0 divisions apart → 100, 4 (1 tier) → 85, 8 (2 tiers) → 70, etc.
    rankScore = Math.max(0, 100 - distance * 5)
  }

  // ─── Role synergy score ────────────────────────────────────────────────────
  let roleScore = 50
  const userRole = (user.preferredRoles[0] ?? "") as Role
  const partnerRole = (candidate.preferredRoles[0] ?? "") as Role
  if (userRole && partnerRole && ROLE_SYNERGY[userRole]?.[partnerRole] !== undefined) {
    roleScore = ROLE_SYNERGY[userRole][partnerRole]
  }

  // Check partner role preference match
  if (
    user.preferredPartnerRoles.length > 0 &&
    partnerRole &&
    !user.preferredPartnerRoles.includes(partnerRole)
  ) {
    roleScore = Math.min(roleScore, 40) // penalize mismatched role preference
  }

  // ─── Availability overlap ──────────────────────────────────────────────────
  const availabilityScore = computeAvailabilityOverlap(
    user.availability,
    candidate.availability
  )

  // ─── Vibe match ────────────────────────────────────────────────────────────
  const vibeScore = jaccardSimilarity(
    user.vibeTags as string[],
    candidate.vibeTags as string[]
  )

  // ─── Communication match ───────────────────────────────────────────────────
  const userStyles = new Set(user.communicationStyle)
  const candidateStyles = candidate.communicationStyle
  const hasCommonStyle = candidateStyles.some((s) => userStyles.has(s))
  const communicationScore = hasCommonStyle ? 100 : 40

  return {
    rankScore,
    roleScore,
    availabilityScore,
    vibeScore,
    communicationScore,
  }
}

/**
 * Score a single candidate against the viewer profile.
 */
export function scoreSingleCandidate(
  viewer: DuoProfile,
  candidate: DuoProfile
): DuoMatchCandidate {
  const results = scoreDuoCandidates({ viewer, candidates: [candidate] })
  return results[0]
}
