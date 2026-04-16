import type { PlayerSession, TiltAnalysis, TiltPattern, StopRecommendation } from "@/types/domain"
import type { TiltStatus } from "@/types/enums"

interface ReflectionInput {
  mentalStateEnd?: number
  tiltMoments?: number
  followedStopCondition?: boolean
  gamesWon?: number
  gamesLost?: number
}

// ─── Scoring rules ─────────────────────────────────────────────────────────────

const RULES = {
  LOSS_STREAK_3: 20,       // 3+ consecutive losses in this session
  MENTAL_DECLINE: 15,      // mental_state_end < mental_state_start
  IGNORED_STOP: 25,        // did not follow stop condition
  SESSION_LONG: 10,        // session > 3 hours
  LOW_ENERGY_START: 10,    // pre mental_state < 3
  HIGH_TILT_RISK_START: 5, // pre tilt_risk >= 4
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getSessionDurationHours(session: PlayerSession): number {
  if (!session.startedAt || !session.endedAt) return 0
  const ms = new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()
  return ms / (1000 * 60 * 60)
}

function getConsecutiveLossesInSession(session: PlayerSession): number {
  // We treat games_lost > games_won in a session as loss-streak indicator
  // For more precise loss streak tracking, session_logs would be needed
  const losses = session.gamesLost ?? 0
  const wins = session.gamesWon ?? 0
  if (losses >= 3 && losses > wins) return losses
  return 0
}

function scoreToStatus(score: number): TiltStatus {
  if (score <= 25) return "locked-in"
  if (score <= 50) return "stable"
  if (score <= 70) return "slipping"
  if (score <= 85) return "tilted"
  return "stop-recommended"
}

// ─── Main export ────────────────────────────────────────────────────────────────

/**
 * Compute a tilt score from recent sessions and optional current reflection input.
 * Score is 0-100. Higher = more tilted.
 */
export function computeTiltScore(
  recentSessions: PlayerSession[],
  currentInput?: ReflectionInput
): TiltAnalysis {
  let score = 0
  const patterns: TiltPattern[] = []
  const now = new Date().toISOString()

  // ─── Rule: session loss streak ─────────────────────────────────────────────
  if (currentInput?.gamesWon !== undefined && currentInput?.gamesLost !== undefined) {
    if (currentInput.gamesLost >= 3 && currentInput.gamesLost > (currentInput.gamesWon ?? 0)) {
      score += RULES.LOSS_STREAK_3
      patterns.push({
        type: "loss-streak",
        occurrences: currentInput.gamesLost,
        lastSeen: now,
        severity: currentInput.gamesLost >= 5 ? "high" : "medium",
      })
    }
  } else {
    // Check recent sessions for loss streaks
    const streakSessions = recentSessions.slice(0, 5).filter(
      (s) => (s.gamesLost ?? 0) >= 3 && (s.gamesLost ?? 0) > (s.gamesWon ?? 0)
    )
    if (streakSessions.length > 0) {
      score += Math.min(RULES.LOSS_STREAK_3, streakSessions.length * 10)
      patterns.push({
        type: "loss-streak",
        occurrences: streakSessions.length,
        lastSeen: streakSessions[0].createdAt,
        severity: streakSessions.length >= 3 ? "high" : "medium",
      })
    }
  }

  // ─── Rule: mental state decline ────────────────────────────────────────────
  const mentalDeclines = recentSessions
    .filter((s) => {
      const start = s.preCheckin?.mentalState
      const end = s.postReflection?.mentalStateEnd
      return start !== undefined && end !== undefined && end < start
    })
    .slice(0, 5)

  if (currentInput?.mentalStateEnd !== undefined) {
    // Just check current input — no preCheckin available here, assume 3 as baseline
    if (currentInput.mentalStateEnd <= 2) {
      score += RULES.MENTAL_DECLINE
      patterns.push({
        type: "mental-decline",
        occurrences: 1,
        lastSeen: now,
        severity: currentInput.mentalStateEnd === 1 ? "high" : "medium",
      })
    }
  } else if (mentalDeclines.length > 0) {
    score += Math.min(RULES.MENTAL_DECLINE * 1.5, mentalDeclines.length * 8)
    patterns.push({
      type: "mental-decline",
      occurrences: mentalDeclines.length,
      lastSeen: mentalDeclines[0].createdAt,
      severity: mentalDeclines.length >= 3 ? "high" : "medium",
    })
  }

  // ─── Rule: ignored stop condition ──────────────────────────────────────────
  if (currentInput?.followedStopCondition === false) {
    score += RULES.IGNORED_STOP
    patterns.push({
      type: "ignored-stop-condition",
      occurrences: 1,
      lastSeen: now,
      severity: "high",
    })
  } else {
    const ignoredSessions = recentSessions
      .filter((s) => s.postReflection?.followedStopCondition === false && s.preCheckin?.stopCondition)
      .slice(0, 5)
    if (ignoredSessions.length > 0) {
      score += Math.min(RULES.IGNORED_STOP, ignoredSessions.length * 12)
      patterns.push({
        type: "ignored-stop-condition",
        occurrences: ignoredSessions.length,
        lastSeen: ignoredSessions[0].createdAt,
        severity: ignoredSessions.length >= 2 ? "high" : "medium",
      })
    }
  }

  // ─── Rule: long session (late-session fatigue) ────────────────────────────
  const longSessions = recentSessions
    .filter((s) => getSessionDurationHours(s) > 3)
    .slice(0, 3)
  if (longSessions.length > 0) {
    score += RULES.SESSION_LONG
    patterns.push({
      type: "late-session",
      occurrences: longSessions.length,
      lastSeen: longSessions[0].createdAt,
      severity: "low",
    })
  }

  // ─── Rule: low mental state at start ──────────────────────────────────────
  const lowStartSessions = recentSessions
    .filter((s) => (s.preCheckin?.mentalState ?? 5) < 3)
    .slice(0, 5)
  if (lowStartSessions.length >= 2) {
    score += RULES.LOW_ENERGY_START
    patterns.push({
      type: "low-energy-start",
      occurrences: lowStartSessions.length,
      lastSeen: lowStartSessions[0].createdAt,
      severity: lowStartSessions.length >= 3 ? "medium" : "low",
    })
  }

  // ─── Clamp and determine status ───────────────────────────────────────────
  score = Math.max(0, Math.min(100, Math.round(score)))
  const status = scoreToStatus(score)

  // ─── Trend: compare current score with previous sessions avg ─────────────
  const previousScores = recentSessions
    .slice(0, 5)
    .map((s) => s.tiltScore)
    .filter((s): s is number => s !== null)

  const avgPrevious = previousScores.length > 0
    ? previousScores.reduce((a, b) => a + b, 0) / previousScores.length
    : score

  const trend =
    score < avgPrevious - 5
      ? "improving"
      : score > avgPrevious + 5
      ? "worsening"
      : "stable"

  // ─── Stop recommendation ──────────────────────────────────────────────────
  const recommendation = buildStopRecommendation(score, patterns)

  return {
    currentScore: score,
    status,
    trend,
    triggerPatterns: patterns,
    recommendation,
  }
}

function buildStopRecommendation(
  score: number,
  patterns: TiltPattern[]
): StopRecommendation | null {
  if (score <= 50) return null

  const highPatterns = patterns.filter((p) => p.severity === "high")
  const triggeringFactors = patterns.map((p) =>
    p.type
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  )

  if (score > 85) {
    return {
      shouldStop: true,
      reason: "Multiple tilt signals detected. Take a break — you'll play better tomorrow.",
      urgency: "hard",
      triggeringFactors,
    }
  }

  if (score > 70) {
    return {
      shouldStop: true,
      reason: highPatterns.length > 0
        ? "Your performance is dropping. Consider calling it for today."
        : "You're showing tilt patterns. One more game, then stop.",
      urgency: "firm",
      triggeringFactors,
    }
  }

  return {
    shouldStop: false,
    reason: "Monitor closely. You're showing some tilt signs.",
    urgency: "soft",
    triggeringFactors,
  }
}
