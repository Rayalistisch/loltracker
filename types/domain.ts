import type {
  Region,
  Rank,
  Division,
  Role,
  SessionStatus,
  DuoRequestStatus,
  SessionEventType,
  CommunicationStyle,
  VibeTag,
  PlaystyleTag,
  TiltStatus,
  TiltTrend,
  StopUrgency,
  TiltPatternType,
  PatternSeverity,
  Language,
} from "./enums"

// ─── Rank ────────────────────────────────────────────────────────────────────

export interface FullRank {
  tier: Rank
  division?: Division
  lp?: number
}

// ─── Player Profile ──────────────────────────────────────────────────────────

export interface PlayerProfile {
  id: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  region: string
  riotId: string | null
  riotIdVerified: boolean
  peakRank: string | null
  currentRank: string | null
  mainRole: string
  secondaryRole: string | null
  playstyleTags: string[]
  lookingForDuo: boolean
  isPublic: boolean
  onboardingCompleted: boolean
  disciplineScore: number
  streakDays: number
  totalSessions: number
  createdAt: string
  updatedAt: string
}

// ─── Connected Game Account ──────────────────────────────────────────────────

export interface ConnectedGameAccount {
  id: string
  userId: string
  riotId: string
  region: Region
  isPrimary: boolean
  verified: boolean
  lastSyncedAt: string | null
  createdAt: string
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface PlayerSession {
  id: string
  userId: string
  status: SessionStatus
  startedAt: string | null
  endedAt: string | null
  plannedGames: number | null
  actualGames: number | null
  gamesWon: number | null
  gamesLost: number | null
  rankAtStart: string | null
  rankAtEnd: string | null
  lpDelta: number | null
  notes: string | null
  tiltScore: number | null
  stopRecommended: boolean
  preCheckin?: PreGameCheckin | null
  postReflection?: PostGameReflection | null
  createdAt: string
  updatedAt: string
}

export interface PreGameCheckin {
  id: string
  sessionId: string
  userId: string
  mentalState: number
  energyLevel: number
  tiltRisk: number
  goal: string
  plannedGames: number
  plannedRoles: Role[]
  championPool: string[]
  stopCondition: string | null
  createdAt: string
}

export interface PostGameReflection {
  id: string
  sessionId: string
  userId: string
  followedStopCondition: boolean
  mentalStateEnd: number
  tiltMoments: number
  biggestMistake: string | null
  whatWentWell: string | null
  improvementFocus: string | null
  wouldPlayAgain: boolean | null
  overallRating: number
  createdAt: string
}

export interface SessionLog {
  id: string
  sessionId: string
  userId: string
  eventType: SessionEventType
  eventData: Record<string, unknown>
  createdAt: string
}

// ─── Duo ─────────────────────────────────────────────────────────────────────

export type AvailabilityMap = Partial<
  Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", number[]>
>

export interface DuoProfile {
  id: string
  userId: string
  profile?: PlayerProfile
  isActive: boolean
  preferredRoles: string[]
  preferredPartnerRoles: string[]
  rankMin: string | null
  rankMax: string | null
  communicationStyle: string[]
  vibeTags: string[]
  languages: string[]
  availability: AvailabilityMap
  bioDuo: string | null
  lastActiveAt: string | null
}

export interface DuoPreferences {
  id: string
  userId: string
  maxRankGap: number
  preferredRegions: string[]
  requireVoice: boolean
  preferredPlayTimes: AvailabilityMap
  priorityWeights: DuoPriorityWeights
  createdAt: string
  updatedAt: string
}

export interface DuoPriorityWeights {
  rank: number
  role: number
  availability: number
  vibe: number
  communication: number
}

export interface DuoMatchRequest {
  id: string
  senderId: string
  receiverId: string
  sender?: PlayerProfile
  receiver?: PlayerProfile
  status: DuoRequestStatus
  message: string | null
  compatibilityScore: number | null
  createdAt: string
  updatedAt: string
  expiresAt: string
}

export interface SavedDuo {
  userId: string
  savedUserId: string
  savedPlayer?: PlayerProfile
  savedDuoProfile?: DuoProfile
  notes: string | null
  createdAt: string
}

// ─── Duo Matching ─────────────────────────────────────────────────────────────

export interface CompatibilityBreakdown {
  rankScore: number
  roleScore: number
  availabilityScore: number
  vibeScore: number
  communicationScore: number
}

export interface DuoMatchCandidate extends DuoProfile {
  compatibilityScore: number
  scoreBreakdown: CompatibilityBreakdown
}

// ─── Champion ─────────────────────────────────────────────────────────────────

export interface Champion {
  id: number
  name: string
  slug: string
  roles: Role[]
  difficulty: number
  imageUrl: string | null
}

export interface PlayerChampionStat {
  userId: string
  championId: number
  champion?: Champion
  gamesPlayed: number
  wins: number
  masteryLevel: number | null
  isInPool: boolean
  notes: string | null
  updatedAt: string
}

export interface PlayerRoleStat {
  userId: string
  role: Role
  gamesPlayed: number
  wins: number
  updatedAt: string
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface TiltPattern {
  type: TiltPatternType
  occurrences: number
  lastSeen: string
  severity: PatternSeverity
}

export interface StopRecommendation {
  shouldStop: boolean
  reason: string
  urgency: StopUrgency
  triggeringFactors: string[]
}

export interface TiltAnalysis {
  currentScore: number
  status: TiltStatus
  trend: TiltTrend
  triggerPatterns: TiltPattern[]
  recommendation: StopRecommendation | null
}

export interface WeeklySummary {
  id: string
  userId: string
  weekStart: string
  sessionsCount: number
  totalGames: number
  gamesWon: number
  lpNet: number
  avgMentalStart: number | null
  avgMentalEnd: number | null
  tiltIncidents: number
  stopConditionsFollowed: number
  disciplineScore: number
  streakAtEnd: number
  computedAt: string
}

export interface DisciplineMetrics {
  score: number
  checkinRate: number
  stopAdherence: number
  reflectionQuality: number
  streakBonus: number
  weekStart: string
}

// ─── Notification Settings ───────────────────────────────────────────────────

export interface NotificationSettings {
  userId: string
  emailDuoRequests: boolean
  emailWeeklySummary: boolean
  emailStreakReminders: boolean
  inAppDuoRequests: boolean
  inAppStopRecommendations: boolean
  reminderTime: string | null
  reminderDays: string[]
  createdAt: string
  updatedAt: string
}
