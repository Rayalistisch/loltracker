export const DDRAGON_VERSION = "14.24.1"

/**
 * DDragon uses different keys than display names for some champions.
 * e.g. "Wukong" is stored as "MonkeyKing", "Nunu & Willump" as "Nunu"
 */
const SLUG_OVERRIDES: Record<string, string> = {
  "Wukong":          "MonkeyKing",
  "Nunu & Willump":  "Nunu",
  "Renata Glasc":    "Renata",
  "Bel'Veth":        "Belveth",
  "Cho'Gath":        "Chogath",
  "Kai'Sa":          "Kaisa",
  "Kha'Zix":         "Khazix",
  "Kog'Maw":         "KogMaw",
  "LeBlanc":         "Leblanc",
  "Lee Sin":         "LeeSin",
  "Master Yi":       "MasterYi",
  "Miss Fortune":    "MissFortune",
  "Tahm Kench":      "TahmKench",
  "Twisted Fate":    "TwistedFate",
  "Vel'Koz":         "Velkoz",
  "Xin Zhao":        "XinZhao",
  "Jarvan IV":       "JarvanIV",
  "Dr. Mundo":       "DrMundo",
  "Aurelion Sol":    "AurelionSol",
  "Rek'Sai":         "RekSai",
  "K'Sante":         "KSante",
  "Hwei":            "Hwei",
}

/** Convert a display name to DDragon's internal champion key */
export function champNameToSlug(name: string): string {
  if (SLUG_OVERRIDES[name]) return SLUG_OVERRIDES[name]
  // Remove spaces, apostrophes, periods, special chars
  return name.replace(/[^a-zA-Z0-9]/g, "")
}

/** 48×48 champion icon (square) */
export function champIconUrl(name: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${champNameToSlug(name)}.png`
}

/**
 * Champion loading art tile (~120×160, landscape).
 * Use with object-cover to crop to a square portrait.
 */
export function champTileUrl(name: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/${champNameToSlug(name)}_0.jpg`
}
