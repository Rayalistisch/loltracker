import type { PlayerSession, DisciplineMetrics } from "@/types/domain"
import { startOfWeek, endOfWeek, isWithinInterval } from "date-fns"

/**
 * Compute weekly discipline score (0-100) from sessions within the given week.
 *
 * Score breakdown:
 * - Check-in rate (35%): sessions with pre-game check-in / total sessions
 * - Stop adherence (35%): followed stop condition / sessions with stop condition
 * - Reflection quality (20%): completeness of post-game reflection
 * - Streak bonus (10%): min(streak_days, 7) / 7
 */
export function computeDisciplineScore(
  sessions: PlayerSession[],
  streakDays: number,
  weekStart?: Date
): DisciplineMetrics {
  const weekDate = weekStart ?? startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 })

  const weekSessions = sessions.filter((s) => {
    const date = new Date(s.createdAt)
    return isWithinInterval(date, { start: weekDate, end: weekEnd })
  })

  const totalSessions = weekSessions.length

  if (totalSessions === 0) {
    return {
      score: 50, // baseline when no data
      checkinRate: 0,
      stopAdherence: 0,
      reflectionQuality: 0,
      streakBonus: Math.min(streakDays, 7) / 7,
      weekStart: weekDate.toISOString(),
    }
  }

  // ─── Check-in rate ─────────────────────────────────────────────────────────
  const sessionsWithCheckin = weekSessions.filter((s) => s.preCheckin != null).length
  const checkinRate = sessionsWithCheckin / totalSessions

  // ─── Stop adherence ────────────────────────────────────────────────────────
  const sessionsWithStopCondition = weekSessions.filter(
    (s) => s.preCheckin?.stopCondition && s.postReflection != null
  )
  const stopAdherence =
    sessionsWithStopCondition.length === 0
      ? 1 // no stop conditions set → neutral, don't penalize
      : sessionsWithStopCondition.filter((s) => s.postReflection?.followedStopCondition).length /
        sessionsWithStopCondition.length

  // ─── Reflection quality ────────────────────────────────────────────────────
  const reflectionQuality =
    weekSessions
      .filter((s) => s.postReflection != null)
      .reduce((sum, s) => {
        const r = s.postReflection!
        const fields = [
          r.overallRating > 0,
          r.mentalStateEnd > 0,
          r.biggestMistake != null && r.biggestMistake.length > 0,
          r.whatWentWell != null && r.whatWentWell.length > 0,
          r.improvementFocus != null && r.improvementFocus.length > 0,
        ]
        return sum + fields.filter(Boolean).length / fields.length
      }, 0) / totalSessions

  // ─── Streak bonus ──────────────────────────────────────────────────────────
  const streakBonus = Math.min(streakDays, 7) / 7

  // ─── Final score ──────────────────────────────────────────────────────────
  const score = Math.round(
    checkinRate * 35 + stopAdherence * 35 + reflectionQuality * 20 + streakBonus * 10
  )

  return {
    score: Math.max(0, Math.min(100, score)),
    checkinRate,
    stopAdherence,
    reflectionQuality,
    streakBonus,
    weekStart: weekDate.toISOString(),
  }
}
