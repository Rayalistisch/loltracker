import type { Role } from "./enums"

// ─── Generic response wrappers ────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ─── Session API ──────────────────────────────────────────────────────────────

export interface CreateSessionRequest {
  plannedGames: number
  rankAtStart?: string
}

export interface UpdateSessionRequest {
  gamesWon?: number
  gamesLost?: number
  status?: "active" | "completed" | "abandoned"
  rankAtEnd?: string
  lpDelta?: number
  notes?: string
}

export interface PreGameCheckinRequest {
  mentalState: number
  energyLevel: number
  tiltRisk: number
  goal: string
  plannedGames: number
  plannedRoles: Role[]
  championPool: string[]
  stopCondition?: string
}

export interface PostGameReflectionRequest {
  followedStopCondition: boolean
  mentalStateEnd: number
  tiltMoments: number
  biggestMistake?: string
  whatWentWell?: string
  improvementFocus?: string
  wouldPlayAgain?: boolean
  overallRating: number
  actualGames: number
  gamesWon: number
  gamesLost: number
  rankAtEnd?: string
  lpDelta?: number
}

// ─── Duo API ──────────────────────────────────────────────────────────────────

export interface DuoMatchFilters {
  region?: string
  rankMin?: string
  rankMax?: string
  roles?: string[]
  communicationStyle?: string[]
  availableNow?: boolean
  page?: number
  pageSize?: number
}

export interface SendDuoRequestRequest {
  receiverId: string
  message?: string
  compatibilityScore?: number
}

export interface RespondDuoRequestRequest {
  status: "accepted" | "declined"
}

// ─── Profile API ──────────────────────────────────────────────────────────────

export interface UpdateProfileRequest {
  displayName?: string
  bio?: string
  region?: string
  mainRole?: Role
  secondaryRole?: Role | null
  playstyleTags?: string[]
  lookingForDuo?: boolean
  isPublic?: boolean
  onboardingCompleted?: boolean
}

export interface ConnectRiotIdRequest {
  gameName: string
  tagLine: string
  region: string
}

// ─── Analytics API ────────────────────────────────────────────────────────────

export interface TiltScoreResponse {
  score: number
  status: string
  trend: string
  triggerPatterns: Array<{
    type: string
    occurrences: number
    severity: string
  }>
  recommendation: {
    shouldStop: boolean
    reason: string
    urgency: string
    triggeringFactors: string[]
  } | null
}

export interface WeeklySummaryResponse {
  weekStart: string
  sessionsCount: number
  totalGames: number
  gamesWon: number
  lpNet: number
  disciplineScore: number
  tiltIncidents: number
  stopConditionsFollowed: number
  avgMentalStart: number | null
  avgMentalEnd: number | null
}
