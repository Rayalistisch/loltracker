import type { Region, Rank, Role, CommunicationStyle, VibeTag, PlaystyleTag, Language } from "@/types/enums"

// ─── Regions ──────────────────────────────────────────────────────────────────

export const REGIONS: { value: Region; label: string }[] = [
  { value: "EUW", label: "EU West" },
  { value: "EUNE", label: "EU Nordic & East" },
  { value: "NA", label: "North America" },
  { value: "KR", label: "Korea" },
  { value: "OCE", label: "Oceania" },
  { value: "BR", label: "Brazil" },
  { value: "LAN", label: "Latin America North" },
  { value: "LAS", label: "Latin America South" },
  { value: "TR", label: "Turkey" },
  { value: "RU", label: "Russia" },
  { value: "JP", label: "Japan" },
  { value: "PH", label: "Philippines" },
  { value: "SG", label: "Singapore" },
  { value: "TW", label: "Taiwan" },
  { value: "VN", label: "Vietnam" },
  { value: "TH", label: "Thailand" },
]

// ─── Ranks ────────────────────────────────────────────────────────────────────

export const RANKS: { value: Rank; label: string; cssClass: string }[] = [
  { value: "IRON", label: "Iron", cssClass: "rank-iron" },
  { value: "BRONZE", label: "Bronze", cssClass: "rank-bronze" },
  { value: "SILVER", label: "Silver", cssClass: "rank-silver" },
  { value: "GOLD", label: "Gold", cssClass: "rank-gold" },
  { value: "PLATINUM", label: "Platinum", cssClass: "rank-platinum" },
  { value: "EMERALD", label: "Emerald", cssClass: "rank-emerald" },
  { value: "DIAMOND", label: "Diamond", cssClass: "rank-diamond" },
  { value: "MASTER", label: "Master", cssClass: "rank-master" },
  { value: "GRANDMASTER", label: "Grandmaster", cssClass: "rank-grandmaster" },
  { value: "CHALLENGER", label: "Challenger", cssClass: "rank-challenger" },
]

export const DIVISIONS = ["IV", "III", "II", "I"] as const

// ─── Roles ────────────────────────────────────────────────────────────────────

export const ROLES: { value: Role; label: string; icon: string }[] = [
  { value: "TOP", label: "Top", icon: "🗡️" },
  { value: "JUNGLE", label: "Jungle", icon: "🌲" },
  { value: "MID", label: "Mid", icon: "⚡" },
  { value: "BOTTOM", label: "Bot", icon: "🏹" },
  { value: "SUPPORT", label: "Support", icon: "🛡️" },
  { value: "FILL", label: "Fill", icon: "🎲" },
]

// Role synergy matrix [userRole][partnerRole] → score 0-100
// Complementary roles score higher
export const ROLE_SYNERGY: Record<Role, Record<Role, number>> = {
  TOP:     { TOP: 30, JUNGLE: 55, MID: 55, BOTTOM: 50, SUPPORT: 50, FILL: 60 },
  JUNGLE:  { TOP: 55, JUNGLE: 30, MID: 70, BOTTOM: 75, SUPPORT: 65, FILL: 60 },
  MID:     { TOP: 55, JUNGLE: 70, MID: 30, BOTTOM: 60, SUPPORT: 55, FILL: 60 },
  BOTTOM:  { TOP: 50, JUNGLE: 75, MID: 60, BOTTOM: 30, SUPPORT: 100, FILL: 60 },
  SUPPORT: { TOP: 50, JUNGLE: 65, MID: 55, BOTTOM: 100, SUPPORT: 30, FILL: 60 },
  FILL:    { TOP: 60, JUNGLE: 60, MID: 60, BOTTOM: 60, SUPPORT: 60, FILL: 60 },
}

// ─── Communication styles ─────────────────────────────────────────────────────

export const COMMUNICATION_STYLES: { value: CommunicationStyle; label: string }[] = [
  { value: "voice", label: "Voice Chat" },
  { value: "text", label: "Text Chat" },
  { value: "pings-only", label: "Pings Only" },
]

// ─── Vibe tags ────────────────────────────────────────────────────────────────

export const VIBE_TAGS: { value: VibeTag; label: string }[] = [
  { value: "chill", label: "Chill" },
  { value: "tryhard", label: "Tryhard" },
  { value: "coach", label: "Coach" },
  { value: "learner", label: "Learner" },
  { value: "memer", label: "Memer" },
  { value: "competitive", label: "Competitive" },
]

// ─── Playstyle tags ───────────────────────────────────────────────────────────

export const PLAYSTYLE_TAGS: { value: PlaystyleTag; label: string }[] = [
  { value: "aggressive", label: "Aggressive" },
  { value: "macro", label: "Macro-focused" },
  { value: "mechanical", label: "Mechanical" },
  { value: "team-oriented", label: "Team-oriented" },
  { value: "split-push", label: "Split Push" },
  { value: "shotcaller", label: "Shotcaller" },
]

// ─── Languages ────────────────────────────────────────────────────────────────

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "nl", label: "Dutch" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
  { value: "ko", label: "Korean" },
  { value: "tr", label: "Turkish" },
  { value: "pl", label: "Polish" },
  { value: "ru", label: "Russian" },
]

// ─── Goals ────────────────────────────────────────────────────────────────────

export const SESSION_GOALS = [
  { value: "climb", label: "Climb" },
  { value: "improve", label: "Improve" },
  { value: "practice-champion", label: "Practice champion" },
  { value: "practice-macro", label: "Practice macro" },
  { value: "have-fun", label: "Have fun" },
  { value: "warmup", label: "Warmup" },
] as const

// ─── Days of week ──────────────────────────────────────────────────────────────

export const DAYS_OF_WEEK = [
  { value: "mon", label: "Mon", fullLabel: "Monday" },
  { value: "tue", label: "Tue", fullLabel: "Tuesday" },
  { value: "wed", label: "Wed", fullLabel: "Wednesday" },
  { value: "thu", label: "Thu", fullLabel: "Thursday" },
  { value: "fri", label: "Fri", fullLabel: "Friday" },
  { value: "sat", label: "Sat", fullLabel: "Saturday" },
  { value: "sun", label: "Sun", fullLabel: "Sunday" },
] as const

export type DayKey = (typeof DAYS_OF_WEEK)[number]["value"]

// ─── Popular champions (seed data for MVP) ────────────────────────────────────

export const POPULAR_CHAMPIONS = [
  "Ahri", "Akali", "Annie", "Ashe", "Blitzcrank", "Brand", "Caitlyn",
  "Darius", "Diana", "Ekko", "Ezreal", "Fiora", "Fizz", "Garen",
  "Graves", "Hecarim", "Irelia", "Janna", "Jhin", "Jinx", "Kaisa",
  "Karma", "Katarina", "Kayle", "Kennen", "Khazix", "LeBlanc", "Lee Sin",
  "Leona", "Lulu", "Lux", "Master Yi", "Miss Fortune", "Morgana", "Nami",
  "Nasus", "Nautilus", "Nidalee", "Orianna", "Pantheon", "Pyke", "Riven",
  "Samira", "Seraphine", "Sett", "Sona", "Soraka", "Syndra", "Thresh",
  "Tristana", "Twisted Fate", "Urgot", "Vayne", "Veigar", "Vi", "Viktor",
  "Vladimir", "Warwick", "Xayah", "Xerath", "Yasuo", "Yone", "Zed", "Ziggs",
  "Zilean", "Zoe", "Zyra",
]
