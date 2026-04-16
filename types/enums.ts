export type Region =
  | "EUW"
  | "EUNE"
  | "NA"
  | "KR"
  | "OCE"
  | "LAN"
  | "LAS"
  | "BR"
  | "TR"
  | "RU"
  | "JP"
  | "PH"
  | "SG"
  | "TW"
  | "VN"
  | "TH"

export type Rank =
  | "IRON"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "EMERALD"
  | "DIAMOND"
  | "MASTER"
  | "GRANDMASTER"
  | "CHALLENGER"

export type Division = "IV" | "III" | "II" | "I"

export type Role = "TOP" | "JUNGLE" | "MID" | "BOTTOM" | "SUPPORT" | "FILL"

export type SessionStatus = "pending" | "active" | "completed" | "abandoned"

export type DuoRequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "expired"

export type SessionEventType =
  | "game_start"
  | "game_end"
  | "tilt_flag"
  | "note"
  | "break"

export type CommunicationStyle = "voice" | "text" | "pings-only"

export type VibeTag =
  | "chill"
  | "tryhard"
  | "coach"
  | "learner"
  | "memer"
  | "competitive"

export type PlaystyleTag =
  | "aggressive"
  | "macro"
  | "mechanical"
  | "team-oriented"
  | "split-push"
  | "shotcaller"

export type TiltStatus =
  | "locked-in"
  | "stable"
  | "slipping"
  | "tilted"
  | "stop-recommended"

export type TiltTrend = "improving" | "stable" | "worsening"

export type StopUrgency = "soft" | "firm" | "hard"

export type TiltPatternType =
  | "loss-streak"
  | "mental-decline"
  | "ignored-stop-condition"
  | "late-session"
  | "low-energy-start"

export type PatternSeverity = "low" | "medium" | "high"

export type GoalType =
  | "climb"
  | "improve"
  | "practice-champion"
  | "practice-macro"
  | "have-fun"
  | "warmup"

export type Language =
  | "en"
  | "nl"
  | "de"
  | "fr"
  | "es"
  | "pt"
  | "ko"
  | "tr"
  | "pl"
  | "ru"
