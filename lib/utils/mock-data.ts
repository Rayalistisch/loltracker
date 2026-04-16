import type { PlayerProfile, PlayerSession, PreGameCheckin, PostGameReflection, DuoProfile, WeeklySummary, TiltAnalysis } from "@/types/domain"

// ─── Mock Player Profile ──────────────────────────────────────────────────────

export const MOCK_PROFILE: PlayerProfile = {
  id: "mock-user-1",
  username: "peakloltracker",
  displayName: "Peak",
  avatarUrl: null,
  bio: "Climbing to Diamond. Mid/Jungle main. 5+ years ranked.",
  region: "EUW",
  riotId: "Peak#EUW",
  riotIdVerified: true,
  peakRank: "DIAMOND II",
  currentRank: "PLATINUM I",
  mainRole: "MID",
  secondaryRole: "JUNGLE",
  playstyleTags: ["aggressive", "mechanical"],
  lookingForDuo: true,
  isPublic: true,
  onboardingCompleted: true,
  disciplineScore: 72,
  streakDays: 5,
  totalSessions: 23,
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
}

// ─── Mock Sessions ────────────────────────────────────────────────────────────

const MOCK_CHAMP_POOLS = [
  ["Ahri", "LeBlanc", "Syndra"],
  ["Zed", "Yasuo", "Akali"],
  ["Jinx", "Caitlyn", "Ezreal"],
  ["Thresh", "Nautilus", "Leona"],
  ["Graves", "Kha'Zix", "Vi"],
  ["Viktor", "Orianna", "Twisted Fate"],
  ["Fiora", "Darius", "Garen"],
  ["Xayah", "Kai'Sa", "Vayne"],
]

const MOCK_GOALS = ["climb", "improve", "practice-champion", "have-fun", "warmup", "practice-macro"]
const MOCK_ROLE_PAIRS: [string, string][] = [
  ["MID", "JUNGLE"], ["JUNGLE", "TOP"], ["BOTTOM", "SUPPORT"],
  ["MID", "TOP"], ["SUPPORT", "MID"], ["TOP", "JUNGLE"],
]

export function generateMockSessions(count = 10): PlayerSession[] {
  const sessions: PlayerSession[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const daysAgo = i
    const startedAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString()
    const endedAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString()
    const gamesPlayed = Math.floor(Math.random() * 6) + 3
    const gamesWon = Math.floor(Math.random() * (gamesPlayed + 1))
    const gamesLost = gamesPlayed - gamesWon
    const lpDelta = (gamesWon - gamesLost) * 15 + Math.floor(Math.random() * 10) - 5
    const tiltScore = Math.max(0, Math.min(100, 40 + Math.floor(Math.random() * 40) - 20))
    const champPool = MOCK_CHAMP_POOLS[i % MOCK_CHAMP_POOLS.length]
    const rolePair = MOCK_ROLE_PAIRS[i % MOCK_ROLE_PAIRS.length]
    const goal = MOCK_GOALS[i % MOCK_GOALS.length]
    const mentalStart = 2 + Math.floor(Math.random() * 3) // 2-4

    const preCheckin: PreGameCheckin = {
      id: `mock-checkin-${i}`,
      sessionId: `mock-session-${i}`,
      userId: "mock-user-1",
      mentalState: mentalStart,
      energyLevel: 2 + Math.floor(Math.random() * 3),
      tiltRisk: 1 + Math.floor(Math.random() * 3),
      goal,
      plannedGames: gamesPlayed + 1,
      plannedRoles: rolePair as any,
      championPool: champPool,
      stopCondition: i % 3 === 0 ? "Stop after 3 losses in a row" : null,
      createdAt: startedAt,
    }

    sessions.push({
      id: `mock-session-${i}`,
      userId: "mock-user-1",
      status: "completed",
      startedAt,
      endedAt,
      plannedGames: gamesPlayed + 1,
      actualGames: gamesPlayed,
      gamesWon,
      gamesLost,
      rankAtStart: "PLATINUM I",
      rankAtEnd: "PLATINUM I",
      lpDelta,
      notes: null,
      tiltScore,
      stopRecommended: tiltScore > 75,
      preCheckin,
      createdAt: startedAt,
      updatedAt: endedAt,
    })
  }

  return sessions
}

export const MOCK_PRE_CHECKIN: PreGameCheckin = {
  id: "mock-checkin-1",
  sessionId: "mock-session-0",
  userId: "mock-user-1",
  mentalState: 4,
  energyLevel: 4,
  tiltRisk: 2,
  goal: "climb",
  plannedGames: 5,
  plannedRoles: ["MID", "JUNGLE"],
  championPool: ["Ahri", "Viktor", "Ekko"],
  stopCondition: "Stop after 3 losses in a row",
  createdAt: new Date().toISOString(),
}

export const MOCK_POST_REFLECTION: PostGameReflection = {
  id: "mock-reflection-1",
  sessionId: "mock-session-0",
  userId: "mock-user-1",
  followedStopCondition: true,
  mentalStateEnd: 3,
  tiltMoments: 1,
  biggestMistake: "Overextended in lane after winning early",
  whatWentWell: "CS was great, won lane hard 3 games",
  improvementFocus: "Better macro awareness when ahead",
  wouldPlayAgain: true,
  overallRating: 4,
  createdAt: new Date().toISOString(),
}

// ─── Mock Weekly Summary ───────────────────────────────────────────────────────

export function generateMockWeeklySummaries(count = 8): WeeklySummary[] {
  const summaries: WeeklySummary[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - i * 7)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Monday
    weekStart.setHours(0, 0, 0, 0)

    const totalGames = Math.floor(Math.random() * 20) + 10
    const gamesWon = Math.floor(Math.random() * (totalGames / 2)) + Math.floor(totalGames / 4)

    summaries.push({
      id: `mock-summary-${i}`,
      userId: "mock-user-1",
      weekStart: weekStart.toISOString(),
      sessionsCount: Math.floor(Math.random() * 5) + 2,
      totalGames,
      gamesWon,
      lpNet: (gamesWon - (totalGames - gamesWon)) * 14,
      avgMentalStart: 3.2 + Math.random() * 1.2,
      avgMentalEnd: 2.8 + Math.random() * 1.2,
      tiltIncidents: Math.floor(Math.random() * 4),
      stopConditionsFollowed: Math.floor(Math.random() * 3) + 1,
      disciplineScore: Math.floor(Math.random() * 30) + 55,
      streakAtEnd: Math.floor(Math.random() * 7),
      computedAt: new Date().toISOString(),
    })
  }

  return summaries
}

// ─── Mock Tilt Analysis ────────────────────────────────────────────────────────

export const MOCK_TILT_ANALYSIS: TiltAnalysis = {
  currentScore: 38,
  status: "stable",
  trend: "improving",
  triggerPatterns: [
    {
      type: "mental-decline",
      occurrences: 3,
      lastSeen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      severity: "medium",
    },
    {
      type: "late-session",
      occurrences: 2,
      lastSeen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      severity: "low",
    },
  ],
  recommendation: null,
}

// ─── Mock Duo Profiles ─────────────────────────────────────────────────────────

export function generateMockDuoProfiles(count = 12): DuoProfile[] {
  const names = ["Nightfall", "Apex", "Chronos", "Phantom", "Nexus", "Rogue", "Void", "Eclipse", "Astral", "Prism", "Surge", "Titan"]
  const roles = [["BOTTOM", "MID"], ["SUPPORT", "MID"], ["TOP", "JUNGLE"], ["MID", "SUPPORT"], ["JUNGLE", "TOP"]]
  const ranks = ["GOLD II", "PLATINUM IV", "PLATINUM I", "DIAMOND IV", "EMERALD II"]

  return names.slice(0, count).map((name, i) => ({
    id: `mock-duo-${i}`,
    userId: `mock-user-duo-${i}`,
    player: {
      id: `mock-user-duo-${i}`,
      username: name.toLowerCase(),
      displayName: name,
      avatarUrl: null,
      bio: `${ranks[i % ranks.length]} player looking for duo`,
      region: "EUW",
      riotId: `${name}#EUW`,
      riotIdVerified: true,
      peakRank: ranks[(i + 1) % ranks.length],
      currentRank: ranks[i % ranks.length],
      mainRole: (roles[i % roles.length][0] as any),
      secondaryRole: (roles[i % roles.length][1] as any),
      playstyleTags: [],
      lookingForDuo: true,
      isPublic: true,
      onboardingCompleted: true,
      disciplineScore: 60 + Math.floor(Math.random() * 30),
      streakDays: Math.floor(Math.random() * 10),
      totalSessions: Math.floor(Math.random() * 50) + 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    isActive: true,
    preferredRoles: [(roles[i % roles.length][0] as any)],
    preferredPartnerRoles: [(roles[i % roles.length][1] as any)],
    rankMin: "GOLD",
    rankMax: "DIAMOND",
    communicationStyle: i % 2 === 0 ? ["voice", "text"] : ["text"],
    vibeTags: i % 3 === 0 ? ["tryhard", "competitive"] : ["chill", "learner"],
    languages: ["en"],
    availability: {
      mon: [19, 20, 21, 22],
      tue: [19, 20, 21, 22],
      wed: [19, 20, 21],
      fri: [19, 20, 21, 22, 23],
      sat: [14, 15, 16, 17, 18, 19, 20, 21, 22],
      sun: [14, 15, 16, 17, 18, 19, 20],
    },
    bioDuo: `Looking for a consistent duo partner to grind ranked with. ${i % 2 === 0 ? "Voice chat preferred." : "Text only."}`,
    lastActiveAt: new Date(Date.now() - i * 6 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))
}
