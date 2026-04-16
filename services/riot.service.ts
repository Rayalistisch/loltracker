/**
 * Riot Games API client — server-side only (uses RIOT_API_KEY env var)
 * Match V5 + Account V1 + Summoner V4 + League V4
 */

// Routing clusters per region (Match V5 uses regional clusters)
const ROUTING: Record<string, string> = {
  NA:  "americas", BR:  "americas", LAN: "americas", LAS: "americas",
  EUW: "europe",   EUNE: "europe",  TR:  "europe",   RU:  "europe",
  KR:  "asia",     JP:  "asia",
  OCE: "sea",      PH:  "sea",      SG:  "sea",      TW:  "sea",
  VN:  "sea",      TH:  "sea",
}

function cluster(region: string): string {
  return ROUTING[(region ?? "EUW").toUpperCase()] ?? "europe"
}

// Platform hosts per region (Summoner V4 + League V4 use platform-specific hosts)
const PLATFORM: Record<string, string> = {
  NA:   "na1",  BR:   "br1",  LAN:  "la1",  LAS:  "la2",
  EUW:  "euw1", EUNE: "eun1", TR:   "tr1",  RU:   "ru1",
  KR:   "kr",   JP:   "jp1",
  OCE:  "oc1",  PH:   "ph2",  SG:   "sg2",  TW:   "tw2",
  VN:   "vn2",  TH:   "th2",
}

function platform(region: string): string {
  return PLATFORM[(region ?? "EUW").toUpperCase()] ?? "euw1"
}

async function riotFetch(url: string): Promise<Response> {
  const key = process.env.RIOT_API_KEY
  if (!key) throw new Error("RIOT_API_KEY is not set in environment variables")
  return fetch(url, {
    headers: { "X-Riot-Token": key },
    cache: "no-store",
  })
}

// ─── Account API ──────────────────────────────────────────────────────────────

/**
 * Get a player's PUUID from their Riot ID ("GameName#TAG")
 */
export async function getPuuid(riotId: string, region: string): Promise<string> {
  const hashIndex = riotId.indexOf("#")
  if (hashIndex === -1) throw new Error(`Invalid Riot ID format: ${riotId}`)
  const gameName = riotId.slice(0, hashIndex)
  const tagLine  = riotId.slice(hashIndex + 1)
  const c = cluster(region)
  const res = await riotFetch(
    `https://${c}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Account lookup failed (${res.status}): ${body}`)
  }
  const data = await res.json()
  return data.puuid as string
}

// ─── Match V5 ─────────────────────────────────────────────────────────────────

export interface MatchSummary {
  matchId:        string
  win:            boolean
  champion:       string
  kills:          number
  deaths:         number
  assists:        number
  cs:             number
  duration:       number  // seconds
  timestamp:      number  // ms since epoch
  // Support-specific
  visionScore?:         number
  wardsPlaced?:         number
  wardsKilled?:         number
  controlWardsPlaced?:  number
  totalHeal?:           number  // healing on teammates
  totalShield?:         number  // shielding on teammates
  ccScore?:             number  // seconds of CC applied to enemies
  // Universal extras
  damageToChampions?:   number
}

/**
 * Return all completed matches for a PUUID since a given epoch timestamp (ms).
 * Includes all queues (ranked + normals) to catch every game played.
 */
export async function getMatchesSince(
  puuid:   string,
  region:  string,
  sinceMs: number,
): Promise<MatchSummary[]> {
  const c = cluster(region)
  const sinceSeconds = Math.floor(sinceMs / 1000)

  const idsRes = await riotFetch(
    `https://${c}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids` +
    `?startTime=${sinceSeconds}&count=20`
  )
  if (!idsRes.ok) return []

  const matchIds: string[] = await idsRes.json()
  if (matchIds.length === 0) return []

  // Fetch details in parallel (cap at 10 to stay within dev key rate limits)
  const details = await Promise.allSettled(
    matchIds.slice(0, 10).map(async (matchId) => {
      const res = await riotFetch(
        `https://${c}.api.riotgames.com/lol/match/v5/matches/${matchId}`
      )
      if (!res.ok) return null
      return res.json()
    })
  )

  const summaries: MatchSummary[] = []

  for (let i = 0; i < details.length; i++) {
    const result = details[i]
    if (result.status !== "fulfilled" || !result.value) continue
    const match = result.value

    // Skip if game is still in progress
    if (match.info.gameEndTimestamp == null && match.info.gameDuration < 60) continue

    const participant = match.info.participants.find(
      (p: { puuid: string }) => p.puuid === puuid
    )
    if (!participant) continue

    summaries.push({
      matchId:   matchIds[i],
      win:       participant.win as boolean,
      champion:  participant.championName as string,
      kills:     participant.kills as number,
      deaths:    participant.deaths as number,
      assists:   participant.assists as number,
      cs:        (participant.totalMinionsKilled + participant.neutralMinionsKilled) as number,
      duration:  match.info.gameDuration as number,
      // Support/universal extras
      visionScore:        participant.visionScore as number,
      wardsPlaced:        participant.wardsPlaced as number,
      wardsKilled:        participant.wardsKilled as number,
      controlWardsPlaced: participant.detectorWardsPlaced as number,
      totalHeal:          (participant.totalHealsOnTeammates ?? 0) as number,
      totalShield:        (participant.totalDamageShieldedOnTeammates ?? 0) as number,
      ccScore:            Math.round((participant.timeCCingOthers ?? 0) as number),
      damageToChampions:  participant.totalDamageDealtToChampions as number,
      timestamp: (match.info.gameEndTimestamp ?? match.info.gameCreation) as number,
    })
  }

  // Sort oldest first so they get added in chronological order
  return summaries.sort((a, b) => a.timestamp - b.timestamp)
}

// ─── Ranked stats ─────────────────────────────────────────────────────────────

export interface RankedStats {
  tier:       string   // "GOLD", "PLATINUM", etc.
  division:   string   // "I", "II", "III", "IV"
  lp:         number
  wins:       number
  losses:     number
  winRate:    number   // percentage 0-100
  label:      string   // "Gold II — 47 LP"
}

/**
 * Fetch Solo/Duo ranked stats for a PUUID.
 * Returns null when the player is unranked or the request fails.
 */
export async function getRankedStats(
  puuid:  string,
  region: string,
): Promise<RankedStats | null> {
  const p = platform(region)

  // league-exp-v4 supports PUUID-based lookup
  const leagueRes = await riotFetch(
    `https://${p}.api.riotgames.com/lol/league-exp/v4/entries/by-puuid/${puuid}`
  )
  if (!leagueRes.ok) {
    const body = await leagueRes.text()
    throw new Error(`League lookup failed (${leagueRes.status}): ${body}`)
  }
  const entries: Array<{
    queueType: string
    tier: string
    rank: string
    leaguePoints: number
    wins: number
    losses: number
  }> = await leagueRes.json()

  const solo = entries.find((e) => e.queueType === "RANKED_SOLO_5x5")
  if (!solo) {
    const queues = entries.map((e) => e.queueType).join(", ")
    throw new Error(`No Solo/Duo entry found. Available queues: ${queues || "none"}`)
  }

  const total   = solo.wins + solo.losses
  const winRate = total > 0 ? Math.round((solo.wins / total) * 100) : 0

  return {
    tier:     solo.tier,
    division: solo.rank,
    lp:       solo.leaguePoints,
    wins:     solo.wins,
    losses:   solo.losses,
    winRate,
    label:    `${capitalise(solo.tier)} ${solo.rank} — ${solo.leaguePoints} LP`,
  }
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}
